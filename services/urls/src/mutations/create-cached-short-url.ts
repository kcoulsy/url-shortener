import { redis } from "../cache/client.js";
import { type CachedShortUrl } from "../queries/get-cached-short-url.js";
import { logger } from "../utils/logger.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

const shortUrlCacheTtlSeconds = 60 * 60 * 24;

export async function createCachedShortUrl(url: CachedShortUrl): Promise<void> {
  try {
    const cacheEntry = {
      id: url.id?.toString(),
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      customSlug: url.customSlug,
    };
    const pathSegments = url.customSlug ? [url.shortCode, url.customSlug] : [url.shortCode];

    await Promise.all(
      pathSegments.map((pathSegment) =>
        redis.set(
          shortUrlCacheKey(pathSegment),
          JSON.stringify(cacheEntry),
          "EX",
          shortUrlCacheTtlSeconds,
        ),
      ),
    );
    logger.debug(
      { shortCode: url.shortCode, customSlug: url.customSlug, ttlSeconds: shortUrlCacheTtlSeconds },
      "Short URL cached",
    );
  } catch (error) {
    logger.warn(
      { error, shortCode: url.shortCode, customSlug: url.customSlug },
      "Could not write short URL to Redis cache",
    );
  }
}
