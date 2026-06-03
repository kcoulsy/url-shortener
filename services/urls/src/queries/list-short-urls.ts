import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";

export type ListShortUrl = Pick<typeof urls.$inferSelect, "shortCode" | "longUrl" | "createdAt">;

export async function listShortUrls(ownerSub: string): Promise<ListShortUrl[]> {
  return db
    .select({
      shortCode: urls.shortCode,
      longUrl: urls.longUrl,
      createdAt: urls.createdAt,
    })
    .from(urls)
    .where(eq(urls.ownerSub, ownerSub))
    .orderBy(desc(urls.createdAt));
}
