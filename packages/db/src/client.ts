import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseConfig } from "./config.js";
import * as schema from "./schema.js";

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
