import type { MiddlewareHandler } from "hono";
import { logger } from "../utils/logger.js";

export const requestLogger: MiddlewareHandler = async (c, next) => {
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
};
