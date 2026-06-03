import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";

export type ShortUrl = typeof urls.$inferSelect;

export async function getFromShortUrl(shortCode: string): Promise<ShortUrl | undefined> {
  const [url] = await db.select().from(urls).where(eq(urls.shortCode, shortCode)).limit(1);

  return url;
}
