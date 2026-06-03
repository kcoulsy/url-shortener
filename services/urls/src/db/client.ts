import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

type PostgresResource = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

function getDatabaseConfig(): PostgresResource {
  const linkedResource = process.env.SST_RESOURCE_ShorteningPostgres;
  if (linkedResource) {
    return JSON.parse(linkedResource) as PostgresResource;
  }

  return {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "password",
    database: process.env.POSTGRES_DB ?? "shortener",
  };
}

const database = getDatabaseConfig();

const pool = new Pool({
  host: database.host,
  port: database.port,
  user: database.username,
  password: database.password,
  database: database.database,
});

export const db = drizzle(pool, { schema });

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
