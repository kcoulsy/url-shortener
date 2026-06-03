import { beforeEach, describe, expect, it, vi } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import { createShortUrl } from "./create-short-url.js";

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
      JSON.stringify({ shortCode: "New0001", longUrl: "https://example.com/new" }),
    );
  });

  it("retries when Postgres rejects a duplicate short code", async () => {
    await db.insert(urls).values({ shortCode: "Dup0001", longUrl: "https://example.com/old" });
    shortCodes.push("Dup0001", "Fresh01");

    const url = await createShortUrl("https://example.com/fresh", "user-1");

    expect(url).toMatchObject({ shortCode: "Fresh01", longUrl: "https://example.com/fresh" });
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
