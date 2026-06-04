ALTER TABLE "urls" ADD COLUMN "custom_slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX "urls_custom_slug_unique" ON "urls" USING btree ("custom_slug");