import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createShortUrl } from "../mutations/create-short-url.js";
import { getFromShortUrl, getOwnedShortUrl } from "../queries/get-from-short-url.js";
import { listShortUrls } from "../queries/list-short-urls.js";
import { logger } from "../utils/logger.js";
import { isShortCode } from "../utils/short-code.js";

const app = new Hono().basePath("/urls");

app.get("/", requireAuth, async (c) => {
  const user = c.get("authUser");
  const links = await listShortUrls(user.sub);

  return c.json({ success: true, links });
});

const PostUrlSchema = z.object({
  url: z.url(),
});

app.post("/", requireAuth, zValidator("json", PostUrlSchema), async (c) => {
  const user = c.get("authUser");
  const longUrl = c.req.valid("json").url;
  const url = await createShortUrl(longUrl, user.sub);
  const shortUrl = new URL(`/urls/${url.shortCode}`, c.req.url).toString();
  const longUrlHost = new URL(longUrl).host;

  logger.info({ ownerSub: user.sub, shortCode: url.shortCode, longUrlHost }, "Short URL created");

  return c.json({ success: true, longUrl, shortCode: url.shortCode, shortUrl });
});

const GetUrlParamsSchema = z.object({
  code: z.string(),
});

const GetUrlQuerySchema = z.object({
  mode: z.union([z.literal("redirect"), z.literal("info")]).default("redirect"),
});

app.use("/:code", async (c, next) => {
  if (c.req.query("mode") === "info") {
    return requireAuth(c, next);
  }

  return next();
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

    const mode = c.req.valid("query").mode;
    const url =
      mode === "info"
        ? await getOwnedShortUrl(shortCode, c.get("authUser").sub)
        : await getFromShortUrl(shortCode);
    if (!url) {
      logger.info({ shortCode }, "Short URL not found");
      return c.json({ success: false, error: "Short URL not found" }, 404);
    }

    if (mode === "info") {
      return c.json({ success: true, shortCode: url.shortCode, longUrl: url.longUrl });
    }

    return c.redirect(url.longUrl);
  },
);

export default app;
