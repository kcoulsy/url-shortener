import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  logger.info({ port }, `Urls service listening on http://localhost:${port}`);
});
