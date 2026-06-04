CREATE TABLE "urls" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"long_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
