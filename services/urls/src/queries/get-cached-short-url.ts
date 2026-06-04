import { redis } from "../cache/client.js";
import { logger } from "../utils/logger.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

export type CachedShortUrl = {
  shortCode: string;
  longUrl: string;
  customSlug?: string | null;
};

export async function getCachedShortUrl(pathSegment: string): Promise<CachedShortUrl | undefined> {
  try {
    const cached = await redis.get(shortUrlCacheKey(pathSegment));
    if (!cached) {
      logger.debug({ pathSegment }, "Short URL cache miss");
      return undefined;
    }

    return JSON.parse(cached) as CachedShortUrl;
  } catch (error) {
    logger.warn({ error, pathSegment }, "Could not read short URL from Redis cache");
    return undefined;
  }
}
