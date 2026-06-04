export type PostgresResource = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export function getDatabaseConfig(): PostgresResource {
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

export function databaseUrl(database = getDatabaseConfig()): string {
  const username = encodeURIComponent(database.username);
  const password = encodeURIComponent(database.password);
  const host = database.host === "localhost" ? "127.0.0.1" : database.host;

  return `postgresql://${username}:${password}@${host}:${database.port}/${database.database}`;
}
