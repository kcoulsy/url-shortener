import { db, urls } from "@aws-project/db";
import { and, eq, or } from "drizzle-orm";
import { createCachedShortUrl } from "../mutations/create-cached-short-url.js";
import { logger } from "../utils/logger.js";
import { getCachedShortUrl } from "./get-cached-short-url.js";

export type ShortUrl = typeof urls.$inferSelect;
export type ResolvedShortUrl = Pick<ShortUrl, "shortCode" | "customSlug" | "longUrl"> & {
  id?: ShortUrl["id"];
};

export async function getFromShortUrl(pathSegment: string): Promise<ResolvedShortUrl | undefined> {
  const cachedUrl = await getCachedShortUrl(pathSegment);
  if (cachedUrl) {
    logger.debug({ pathSegment }, "Short URL resolved from cache");
    return { ...cachedUrl, customSlug: cachedUrl.customSlug ?? null };
  }

  const [url] = await db
    .select()
    .from(urls)
    .where(or(eq(urls.shortCode, pathSegment), eq(urls.customSlug, pathSegment)))
    .limit(1);
  if (url) {
    logger.debug({ pathSegment }, "Short URL resolved from database");
    await createCachedShortUrl(url);
  }

  return url;
}

export async function getOwnedShortUrl(
  pathSegment: string,
  ownerSub: string,
): Promise<ResolvedShortUrl | undefined> {
  const [url] = await db
    .select()
    .from(urls)
    .where(
      and(
        or(eq(urls.shortCode, pathSegment), eq(urls.customSlug, pathSegment)),
        eq(urls.ownerSub, ownerSub),
      ),
    )
    .limit(1);

  return url;
}
