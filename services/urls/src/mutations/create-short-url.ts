import { db, urls } from "@aws-project/db";
import { eq, or } from "drizzle-orm";
import { isUniqueViolation } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { createShortCode } from "../utils/short-code.js";
import { createCachedShortUrl } from "./create-cached-short-url.js";

export type ShortUrl = typeof urls.$inferSelect;

export class CustomSlugUnavailableError extends Error {
  constructor(public readonly customSlug: string) {
    super("Custom slug already exists");
  }
}

type CreateShortUrlOptions = {
  customSlug?: string;
};

async function pathSegmentExists(segment: string): Promise<boolean> {
  const [url] = await db
    .select({ id: urls.id })
    .from(urls)
    .where(or(eq(urls.shortCode, segment), eq(urls.customSlug, segment)))
    .limit(1);

  return Boolean(url);
}

export async function createShortUrl(
  longUrl: string,
  ownerSub: string,
  options: CreateShortUrlOptions = {},
): Promise<ShortUrl> {
  if (options.customSlug && (await pathSegmentExists(options.customSlug))) {
    throw new CustomSlugUnavailableError(options.customSlug);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = createShortCode();
    if (await pathSegmentExists(shortCode)) {
      logger.warn({ shortCode, attempt: attempt + 1 }, "Generated short code already exists");
      continue;
    }

    try {
      const [url] = await db
        .insert(urls)
        .values({ longUrl, ownerSub, shortCode, customSlug: options.customSlug })
        .returning();
      await createCachedShortUrl(url);
      return url;
    } catch (error) {
      if (options.customSlug && isUniqueViolation(error)) {
        throw new CustomSlugUnavailableError(options.customSlug);
      }

      if (!isUniqueViolation(error)) {
        throw error;
      }

      logger.warn({ shortCode, attempt: attempt + 1 }, "Generated short code already exists");
    }
  }

  throw new Error("Could not generate a unique short code");
}
