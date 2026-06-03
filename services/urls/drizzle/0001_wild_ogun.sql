ALTER TABLE "urls" ADD COLUMN "short_code" text;--> statement-breakpoint
UPDATE "urls" SET "short_code" = substring(md5("id"::text || ':' || clock_timestamp()::text), 1, 7) WHERE "short_code" IS NULL;--> statement-breakpoint
ALTER TABLE "urls" ALTER COLUMN "short_code" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "urls_short_code_unique" ON "urls" USING btree ("short_code");
