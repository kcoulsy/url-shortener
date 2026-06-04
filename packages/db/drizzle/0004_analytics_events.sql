CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"url_id" bigint,
	"short_code" text NOT NULL,
	"path_segment" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"referrer" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'analytics_events_url_id_urls_id_fk'
	) THEN
		ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_short_code_occurred_at_idx" ON "analytics_events" USING btree ("short_code","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_url_id_occurred_at_idx" ON "analytics_events" USING btree ("url_id","occurred_at");
