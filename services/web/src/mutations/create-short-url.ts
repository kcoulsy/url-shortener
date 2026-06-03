import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { isUniqueViolation } from "../utils/errors.js";
import { createShortCode } from "../utils/short-code.js";

export type ShortUrl = typeof urls.$inferSelect;

export async function createShortUrl(longUrl: string): Promise<ShortUrl> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = createShortCode();

    try {
      const [url] = await db.insert(urls).values({ longUrl, shortCode }).returning();
      return url;
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new Error("Could not generate a unique short code");
}
