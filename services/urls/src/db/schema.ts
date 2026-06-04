import { bigserial, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const urls = pgTable(
  "urls",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    shortCode: text("short_code").notNull(),
    longUrl: text("long_url").notNull(),
    ownerSub: text("owner_sub"),
    customSlug: text("custom_slug"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("urls_short_code_unique").on(table.shortCode),
    uniqueIndex("urls_custom_slug_unique").on(table.customSlug),
  ],
);
