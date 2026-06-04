import {
  bigserial,
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    urlId: bigint("url_id", { mode: "bigint" }).references(() => urls.id, { onDelete: "set null" }),
    shortCode: text("short_code").notNull(),
    pathSegment: text("path_segment").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_short_code_occurred_at_idx").on(table.shortCode, table.occurredAt),
    index("analytics_events_url_id_occurred_at_idx").on(table.urlId, table.occurredAt),
  ],
);
