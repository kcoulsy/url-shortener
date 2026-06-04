import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/config.js";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl(),
  },
});
