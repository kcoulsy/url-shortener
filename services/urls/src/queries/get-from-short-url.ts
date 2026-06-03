import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { createCachedShortUrl } from "../mutations/create-cached-short-url.js";
import { logger } from "../utils/logger.js";
import { getCachedShortUrl } from "./get-cached-short-url.js";

export type ShortUrl = typeof urls.$inferSelect;
export type ResolvedShortUrl = Pick<ShortUrl, "shortCode" | "longUrl">;

export async function getFromShortUrl(shortCode: string): Promise<ResolvedShortUrl | undefined> {
  const cachedUrl = await getCachedShortUrl(shortCode);
  if (cachedUrl) {
    logger.debug({ shortCode }, "Short URL resolved from cache");
    return cachedUrl;
  }

  const [url] = await db.select().from(urls).where(eq(urls.shortCode, shortCode)).limit(1);
  if (url) {
    logger.debug({ shortCode }, "Short URL resolved from database");
    await createCachedShortUrl(url);
  }

  return url;
}
