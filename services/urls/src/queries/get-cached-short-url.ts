import { redis } from "../cache/client.js";
import { logger } from "../utils/logger.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

export type CachedShortUrl = {
  shortCode: string;
  longUrl: string;
};

export async function getCachedShortUrl(shortCode: string): Promise<CachedShortUrl | undefined> {
  try {
    const cached = await redis.get(shortUrlCacheKey(shortCode));
    if (!cached) {
      logger.debug({ shortCode }, "Short URL cache miss");
      return undefined;
    }

    return JSON.parse(cached) as CachedShortUrl;
  } catch (error) {
    logger.warn({ error, shortCode }, "Could not read short URL from Redis cache");
    return undefined;
  }
}
