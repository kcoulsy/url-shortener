import { Redis } from "ioredis";
import { logger } from "../utils/logger.js";

type RedisResource = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: boolean;
};

function getRedisConfig(): RedisResource {
  const linkedResource = process.env.SST_RESOURCE_ShorteningRedis;
  if (linkedResource) {
    const resource = JSON.parse(linkedResource) as RedisResource;
    return {
      ...resource,
      tls: resource.host !== "localhost" && resource.host !== "127.0.0.1",
    };
  }

  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === "true",
  };
}

const redisConfig = getRedisConfig();

export const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username,
  password: redisConfig.password,
  tls: redisConfig.tls ? {} : undefined,
  connectTimeout: 500,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

redis.on("error", (error: Error) => {
  logger.warn({ error }, "Redis cache error");
});
