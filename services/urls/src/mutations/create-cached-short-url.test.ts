import { afterEach, describe, expect, it, vi } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import { createCachedShortUrl } from "./create-cached-short-url.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createCachedShortUrl", () => {
  it("writes the cache payload with a 24 hour TTL", async () => {
    await createCachedShortUrl({ shortCode: "Cache01", longUrl: "https://example.com/cache" });

    const key = shortUrlCacheKey("Cache01");
    await expect(redis.get(key)).resolves.toBe(
      JSON.stringify({ shortCode: "Cache01", longUrl: "https://example.com/cache" }),
    );
    await expect(redis.ttl(key)).resolves.toBeGreaterThan(0);
    await expect(redis.ttl(key)).resolves.toBeLessThanOrEqual(60 * 60 * 24);
  });

  it("writes custom slug aliases with the same cache payload", async () => {
    await createCachedShortUrl({
      shortCode: "Cache01",
      customSlug: "docs",
      longUrl: "https://example.com/cache",
    });

    await expect(
      redis.get(shortUrlCacheKey("Cache01")).then((value) => JSON.parse(value ?? "")),
    ).resolves.toEqual({
      shortCode: "Cache01",
      customSlug: "docs",
      longUrl: "https://example.com/cache",
    });
    await expect(
      redis.get(shortUrlCacheKey("docs")).then((value) => JSON.parse(value ?? "")),
    ).resolves.toEqual({
      shortCode: "Cache01",
      customSlug: "docs",
      longUrl: "https://example.com/cache",
    });
  });

  it("swallows Redis write failures and logs a warning", async () => {
    const setSpy = vi.spyOn(redis, "set").mockRejectedValueOnce(new Error("redis write failed"));
    const { logger } = await import("../utils/logger.js");
    const warnSpy = vi.spyOn(logger, "warn");

    await expect(
      createCachedShortUrl({ shortCode: "Write01", longUrl: "https://example.com/write" }),
    ).resolves.toBeUndefined();

    expect(setSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ shortCode: "Write01", error: expect.any(Error) }),
      "Could not write short URL to Redis cache",
    );
  });
});
