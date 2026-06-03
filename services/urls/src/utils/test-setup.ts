import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.POSTGRES_HOST ??= "localhost";
process.env.POSTGRES_PORT ??= "5432";
process.env.POSTGRES_USER ??= "postgres";
process.env.POSTGRES_PASSWORD ??= "password";
process.env.POSTGRES_DB ??= "shortener";
process.env.REDIS_HOST ??= "localhost";
process.env.REDIS_PORT ??= "6379";
process.env.COGNITO_CLIENT_ID ??= "test-client";
process.env.COGNITO_USER_POOL_ID ??= "us-east-1_test";

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  connectTimeout: 500,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

async function runMigration(fileName: string): Promise<void> {
  const migration = await readFile(join(process.cwd(), "drizzle", fileName), "utf8");
  const statements = migration
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function resetSchema(): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS "urls"');
  await runMigration("0000_quiet_shiver_man.sql");
  await runMigration("0001_wild_ogun.sql");
  await runMigration("0002_owner_sub.sql");
}

async function resetData(): Promise<void> {
  await pool.query('TRUNCATE TABLE "urls" RESTART IDENTITY');
  await redis.flushdb();
}

beforeAll(async () => {
  try {
    await pool.query("SELECT 1");
    await redis.ping();
  } catch (error) {
    throw new Error("URLs tests require Postgres and Redis from `docker compose up -d`.", {
      cause: error,
    });
  }

  await resetSchema();
});

beforeEach(async () => {
  await resetData();
});

afterAll(async () => {
  await pool.end();
  redis.disconnect();

  const [{ closeDatabase }, { redis: appRedis }] = await Promise.all([
    import("../db/client.js"),
    import("../cache/client.js"),
  ]);

  await closeDatabase();
  appRedis.disconnect();
});
