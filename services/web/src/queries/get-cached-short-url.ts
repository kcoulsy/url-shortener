import { redis } from "../cache/client.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";

export type CachedShortUrl = {
  shortCode: string;
  longUrl: string;
};

export async function getCachedShortUrl(shortCode: string): Promise<CachedShortUrl | undefined> {
  try {
    const cached = await redis.get(shortUrlCacheKey(shortCode));
    if (!cached) {
      return undefined;
    }

    return JSON.parse(cached) as CachedShortUrl;
  } catch (error) {
    console.warn("Could not read short URL from Redis cache", error);
    return undefined;
  }
}
