import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createShortUrl } from "../mutations/create-short-url.js";
import { getFromShortUrl } from "../queries/get-from-short-url.js";
import { logger } from "../utils/logger.js";
import { isShortCode } from "../utils/short-code.js";

const app = new Hono().basePath("/urls");

const PostUrlSchema = z.object({
  url: z.url(),
});

app.post("/", zValidator("json", PostUrlSchema), async (c) => {
  const longUrl = c.req.valid("json").url;
  const url = await createShortUrl(longUrl);
  const shortUrl = new URL(`/urls/${url.shortCode}`, c.req.url).toString();
  const longUrlHost = new URL(longUrl).host;

  logger.info({ shortCode: url.shortCode, longUrlHost }, "Short URL created");

  return c.json({ success: true, longUrl, shortCode: url.shortCode, shortUrl });
});

const GetUrlParamsSchema = z.object({
  code: z.string(),
});

const GetUrlQuerySchema = z.object({
  mode: z.union([z.literal("redirect"), z.literal("info")]).default("redirect"),
});

app.get(
  "/:code",
  zValidator("param", GetUrlParamsSchema),
  zValidator("query", GetUrlQuerySchema),
  async (c) => {
    const shortCode = c.req.param("code");
    if (!isShortCode(shortCode)) {
      logger.warn({ shortCode }, "Invalid short code requested");
      return c.json({ success: false, error: "Invalid short code" }, 400);
    }

    const url = await getFromShortUrl(shortCode);
    if (!url) {
      logger.info({ shortCode }, "Short URL not found");
      return c.json({ success: false, error: "Short URL not found" }, 404);
    }

    if (c.req.valid("query").mode === "info") {
      return c.json({ success: true, shortCode: url.shortCode, longUrl: url.longUrl });
    }

    return c.redirect(url.longUrl);
  },
);

export default app;
