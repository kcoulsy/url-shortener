import pino from "pino";
import pretty from "pino-pretty";

const isProduction = process.env.NODE_ENV === "production";

const stream = isProduction
  ? undefined
  : pretty({
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  },
  stream,
);
