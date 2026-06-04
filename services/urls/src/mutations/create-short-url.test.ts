import { beforeEach, describe, expect, it, vi } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import { createShortUrl, CustomSlugUnavailableError } from "./create-short-url.js";

const { shortCodes } = vi.hoisted(() => ({ shortCodes: [] as string[] }));

vi.mock("../utils/short-code.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/short-code.js")>();

  return {
    ...actual,
    createShortCode: () => {
      const shortCode = shortCodes.shift();
      if (!shortCode) {
        throw new Error("No test short code queued");
      }

      return shortCode;
    },
  };
});

describe("createShortUrl", () => {
  beforeEach(() => {
    shortCodes.length = 0;
  });

  it("inserts a row and writes it to cache", async () => {
    shortCodes.push("New0001");

    const url = await createShortUrl("https://example.com/new", "user-1");

    expect(url).toMatchObject({
      shortCode: "New0001",
      longUrl: "https://example.com/new",
      ownerSub: "user-1",
    });
    const [stored] = await db.select().from(urls);
    expect(stored).toMatchObject({
      shortCode: "New0001",
      longUrl: "https://example.com/new",
      ownerSub: "user-1",
    });
    await expect(redis.get(shortUrlCacheKey("New0001"))).resolves.toBe(
      JSON.stringify({
        shortCode: "New0001",
        longUrl: "https://example.com/new",
        customSlug: null,
      }),
    );
  });

  it("inserts a custom slug while still generating a short code", async () => {
    shortCodes.push("Gen0001");

    const url = await createShortUrl("https://example.com/custom", "user-1", {
      customSlug: "summer-sale",
    });

    expect(url).toMatchObject({
      shortCode: "Gen0001",
      customSlug: "summer-sale",
      longUrl: "https://example.com/custom",
      ownerSub: "user-1",
    });
    await expect(redis.get(shortUrlCacheKey("Gen0001"))).resolves.toBe(
      JSON.stringify({
        shortCode: "Gen0001",
        longUrl: "https://example.com/custom",
        customSlug: "summer-sale",
      }),
    );
    await expect(redis.get(shortUrlCacheKey("summer-sale"))).resolves.toBe(
      JSON.stringify({
        shortCode: "Gen0001",
        longUrl: "https://example.com/custom",
        customSlug: "summer-sale",
      }),
    );
  });

  it("retries when Postgres rejects a duplicate short code", async () => {
    await db.insert(urls).values({ shortCode: "Dup0001", longUrl: "https://example.com/old" });
    shortCodes.push("Dup0001", "Fresh01");

    const url = await createShortUrl("https://example.com/fresh", "user-1");

    expect(url).toMatchObject({ shortCode: "Fresh01", longUrl: "https://example.com/fresh" });
  });

  it("retries when a generated short code would collide with a custom slug", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Old0001", customSlug: "Taken01", longUrl: "https://example.com/old" });
    shortCodes.push("Taken01", "Fresh01");

    const url = await createShortUrl("https://example.com/fresh", "user-1");

    expect(url).toMatchObject({ shortCode: "Fresh01", longUrl: "https://example.com/fresh" });
  });

  it("throws when the requested custom slug is already a custom slug", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Old0001", customSlug: "claimed", longUrl: "https://example.com/old" });

    await expect(
      createShortUrl("https://example.com/new", "user-1", { customSlug: "claimed" }),
    ).rejects.toBeInstanceOf(CustomSlugUnavailableError);
  });

  it("throws when the requested custom slug collides with an existing short code", async () => {
    await db.insert(urls).values({ shortCode: "Claimed", longUrl: "https://example.com/old" });

    await expect(
      createShortUrl("https://example.com/new", "user-1", { customSlug: "Claimed" }),
    ).rejects.toBeInstanceOf(CustomSlugUnavailableError);
  });

  it("throws after exhausting duplicate short code retries", async () => {
    await db.insert(urls).values({ shortCode: "Same001", longUrl: "https://example.com/same" });
    shortCodes.push("Same001", "Same001", "Same001", "Same001", "Same001");

    await expect(createShortUrl("https://example.com/exhausted", "user-1")).rejects.toThrow(
      "Could not generate a unique short code",
    );
  });

  it("rethrows non-unique database errors", async () => {
    shortCodes.push("Null001");

    await expect(createShortUrl(null as unknown as string, "user-1")).rejects.toMatchObject({
      cause: { code: "23502" },
    });
  });
});
