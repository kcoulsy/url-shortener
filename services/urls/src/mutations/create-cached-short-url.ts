import { redis } from "../cache/client.js";
import { type CachedShortUrl } from "../queries/get-cached-short-url.js";
import { logger } from "../utils/logger.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

const shortUrlCacheTtlSeconds = 60 * 60 * 24;

export async function createCachedShortUrl(url: CachedShortUrl): Promise<void> {
  try {
    const cacheEntry: CachedShortUrl = {
      shortCode: url.shortCode,
      longUrl: url.longUrl,
    };

    await redis.set(shortUrlCacheKey(url.shortCode), JSON.stringify(cacheEntry), "EX", shortUrlCacheTtlSeconds);
    logger.debug({ shortCode: url.shortCode, ttlSeconds: shortUrlCacheTtlSeconds }, "Short URL cached");
  } catch (error) {
    logger.warn({ error, shortCode: url.shortCode }, "Could not write short URL to Redis cache");
  }
}
