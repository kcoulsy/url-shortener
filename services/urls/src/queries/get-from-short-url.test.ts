import { describe, expect, it } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import { getFromShortUrl } from "./get-from-short-url.js";

describe("getFromShortUrl", () => {
  it("returns cached entries without needing a database row", async () => {
    await redis.set(
      shortUrlCacheKey("Cached1"),
      JSON.stringify({ shortCode: "Cached1", longUrl: "https://example.com/cached" }),
    );

    await expect(getFromShortUrl("Cached1")).resolves.toEqual({
      shortCode: "Cached1",
      longUrl: "https://example.com/cached",
    });
  });

  it("falls back to the database and populates the cache", async () => {
    await db.insert(urls).values({ shortCode: "Db00001", longUrl: "https://example.com/db" });

    await expect(getFromShortUrl("Db00001")).resolves.toEqual(
      expect.objectContaining({
        shortCode: "Db00001",
        longUrl: "https://example.com/db",
      }),
    );
    await expect(redis.get(shortUrlCacheKey("Db00001"))).resolves.toBe(
      JSON.stringify({ shortCode: "Db00001", longUrl: "https://example.com/db" }),
    );
  });

  it("returns undefined when the short code is not found", async () => {
    await expect(getFromShortUrl("Gone001")).resolves.toBeUndefined();
  });
});
