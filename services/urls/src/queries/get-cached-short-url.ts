import { redis } from "../cache/client.js";
import { logger } from "../utils/logger.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

export type CachedShortUrl = {
  id?: bigint;
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

    const parsed = JSON.parse(cached) as Omit<CachedShortUrl, "id"> & { id?: string };
    return {
      ...parsed,
      id: parsed.id ? BigInt(parsed.id) : undefined,
    };
  } catch (error) {
    logger.warn({ error, pathSegment }, "Could not read short URL from Redis cache");
    return undefined;
  }
}
