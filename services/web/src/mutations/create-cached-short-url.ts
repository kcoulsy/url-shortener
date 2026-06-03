import { redis } from "../cache/client.js";
import { type CachedShortUrl } from "../queries/get-cached-short-url.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

const shortUrlCacheTtlSeconds = 60 * 60 * 24;

export async function createCachedShortUrl(url: CachedShortUrl): Promise<void> {
  try {
    const cacheEntry: CachedShortUrl = {
      shortCode: url.shortCode,
      longUrl: url.longUrl,
    };

    await redis.set(shortUrlCacheKey(url.shortCode), JSON.stringify(cacheEntry), "EX", shortUrlCacheTtlSeconds);
  } catch (error) {
    console.warn("Could not write short URL to Redis cache", error);
  }
}
