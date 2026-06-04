import { db, urls } from "@aws-project/db";
import { desc, eq } from "drizzle-orm";

export type ListShortUrl = Pick<
  typeof urls.$inferSelect,
  "shortCode" | "customSlug" | "longUrl" | "createdAt"
>;

export async function listShortUrls(ownerSub: string): Promise<ListShortUrl[]> {
  return db
    .select({
      shortCode: urls.shortCode,
      customSlug: urls.customSlug,
      longUrl: urls.longUrl,
      createdAt: urls.createdAt,
    })
    .from(urls)
    .where(eq(urls.ownerSub, ownerSub))
    .orderBy(desc(urls.createdAt));
}
