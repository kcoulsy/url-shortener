import { afterEach, describe, expect, it, vi } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import { getCachedShortUrl } from "./get-cached-short-url.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getCachedShortUrl", () => {
  it("returns cached values", async () => {
    await redis.set(
      shortUrlCacheKey("Hit1234"),
      JSON.stringify({ shortCode: "Hit1234", longUrl: "https://example.com/hit" }),
    );

    await expect(getCachedShortUrl("Hit1234")).resolves.toEqual({
      shortCode: "Hit1234",
      longUrl: "https://example.com/hit",
    });
  });

  it("returns undefined for cache misses", async () => {
    await expect(getCachedShortUrl("Miss001")).resolves.toBeUndefined();
  });

  it("returns undefined for Redis read failures", async () => {
    vi.spyOn(redis, "get").mockRejectedValueOnce(new Error("redis read failed"));

    await expect(getCachedShortUrl("Err0001")).resolves.toBeUndefined();
  });

  it("returns undefined for invalid cached JSON", async () => {
    await redis.set(shortUrlCacheKey("BadJson"), "{");

    await expect(getCachedShortUrl("BadJson")).resolves.toBeUndefined();
  });
});
