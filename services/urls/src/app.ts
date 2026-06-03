import { Hono } from "hono";
import urls from "./routes/urls.js";
import { logger } from "./utils/logger.js";

export const app = new Hono();

app.use(async (c, next) => {
  const start = performance.now();

  try {
    await next();
  } catch (error) {
    logger.error(
      {
        error,
        method: c.req.method,
        path: c.req.path,
        durationMs: Math.round(performance.now() - start),
      },
      "Request failed",
    );
    throw error;
  }

  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    },
    "Request completed",
  );
});

app.get("/health", (c) => {
  return c.json({ ok: true });
});

app.route("/", urls);
