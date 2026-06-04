import { describe, expect, it } from "vitest";
import "../utils/test-setup.js";
import { db, urls } from "@aws-project/db";
import { redis } from "../cache/client.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import { getFromShortUrl } from "./get-from-short-url.js";

describe("getFromShortUrl", () => {
  it("returns cached entries without needing a database row", async () => {
    await redis.set(
      shortUrlCacheKey("Cached1"),
      JSON.stringify({
        shortCode: "Cached1",
        longUrl: "https://example.com/cached",
        customSlug: null,
      }),
    );

    await expect(getFromShortUrl("Cached1")).resolves.toEqual({
      shortCode: "Cached1",
      longUrl: "https://example.com/cached",
      customSlug: null,
    });
  });

  it("falls back to the database and populates the cache", async () => {
    const [url] = await db
      .insert(urls)
      .values({ shortCode: "Db00001", longUrl: "https://example.com/db" })
      .returning();

    await expect(getFromShortUrl("Db00001")).resolves.toEqual(
      expect.objectContaining({
        shortCode: "Db00001",
        longUrl: "https://example.com/db",
      }),
    );
    await expect(redis.get(shortUrlCacheKey("Db00001"))).resolves.toBe(
      JSON.stringify({
        id: url.id.toString(),
        shortCode: "Db00001",
        longUrl: "https://example.com/db",
        customSlug: null,
      }),
    );
  });

  it("resolves custom slugs and populates both cache aliases", async () => {
    const [url] = await db
      .insert(urls)
      .values({ shortCode: "Db00001", customSlug: "docs", longUrl: "https://example.com/docs" })
      .returning();

    await expect(getFromShortUrl("docs")).resolves.toEqual(
      expect.objectContaining({
        shortCode: "Db00001",
        customSlug: "docs",
        longUrl: "https://example.com/docs",
      }),
    );
    await expect(redis.get(shortUrlCacheKey("Db00001"))).resolves.toBe(
      JSON.stringify({
        id: url.id.toString(),
        shortCode: "Db00001",
        longUrl: "https://example.com/docs",
        customSlug: "docs",
      }),
    );
    await expect(redis.get(shortUrlCacheKey("docs"))).resolves.toBe(
      JSON.stringify({
        id: url.id.toString(),
        shortCode: "Db00001",
        longUrl: "https://example.com/docs",
        customSlug: "docs",
      }),
    );
  });

  it("returns undefined when the short code is not found", async () => {
    await expect(getFromShortUrl("Gone001")).resolves.toBeUndefined();
  });
});
