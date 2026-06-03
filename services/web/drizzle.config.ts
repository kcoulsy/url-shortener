import { defineConfig } from "drizzle-kit";

type PostgresResource = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

function databaseUrl(database: PostgresResource): string {
  const username = encodeURIComponent(database.username);
  const password = encodeURIComponent(database.password);
  const host = database.host === "localhost" ? "127.0.0.1" : database.host;

  return `postgresql://${username}:${password}@${host}:${database.port}/${database.database}`;
}

function getDatabaseConfig(): PostgresResource {
  const linkedResource = process.env.SST_RESOURCE_ShorteningPostgres;
  if (linkedResource) {
    return JSON.parse(linkedResource) as PostgresResource;
  }

  return {
    host: process.env.POSTGRES_HOST ?? "127.0.0.1",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "password",
    database: process.env.POSTGRES_DB ?? "shortener",
  };
}

const database = getDatabaseConfig();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl(database),
  },
});
