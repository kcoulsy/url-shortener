import { analyticsEvents, db, urls } from "@aws-project/db";
import { desc, eq, max, sql } from "drizzle-orm";

export type ListShortUrl = Pick<
  typeof urls.$inferSelect,
  "shortCode" | "customSlug" | "longUrl" | "createdAt"
> & {
  clickCount: number;
  lastClickedAt: Date | null;
};

export async function listShortUrls(ownerSub: string): Promise<ListShortUrl[]> {
  return db
    .select({
      shortCode: urls.shortCode,
      customSlug: urls.customSlug,
      longUrl: urls.longUrl,
      createdAt: urls.createdAt,
      clickCount: sql<number>`cast(count(${analyticsEvents.id}) as int)`,
      lastClickedAt: max(analyticsEvents.occurredAt),
    })
    .from(urls)
    .leftJoin(analyticsEvents, eq(analyticsEvents.urlId, urls.id))
    .where(eq(urls.ownerSub, ownerSub))
    .groupBy(urls.shortCode, urls.customSlug, urls.longUrl, urls.createdAt)
    .orderBy(desc(urls.createdAt));
}
