import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type {
  CreateLinkResponse,
  ErrorResponse,
  GetLinkInfoResponse,
  ListLinksResponse,
} from "urls/types";
import { requireAuth } from "../middleware/auth.js";
import { createShortUrl, CustomSlugUnavailableError } from "../mutations/create-short-url.js";
import { getFromShortUrl, getOwnedShortUrl } from "../queries/get-from-short-url.js";
import { listShortUrls } from "../queries/list-short-urls.js";
import { logger } from "../utils/logger.js";
import { isCustomSlug, isUrlPathSegment } from "../utils/short-code.js";

const app = new Hono().basePath("/urls");

app.get("/", requireAuth, async (c) => {
  const user = c.get("authUser");
  const links = await listShortUrls(user.sub);
  const body: ListLinksResponse = {
    success: true,
    links: links.map((link) => ({
      ...link,
      createdAt: link.createdAt.toISOString(),
    })),
  };

  return c.json(body);
});

const PostUrlSchema = z.object({
  url: z.url(),
  customSlug: z.string().refine(isCustomSlug, "Invalid custom slug").optional(),
});

app.post("/", requireAuth, zValidator("json", PostUrlSchema), async (c) => {
  const user = c.get("authUser");
  const { customSlug, url: longUrl } = c.req.valid("json");
  const url = await createShortUrl(longUrl, user.sub, { customSlug });
  const publicPathSegment = url.customSlug ?? url.shortCode;
  const shortUrl = new URL(`/urls/${publicPathSegment}`, c.req.url).toString();
  const longUrlHost = new URL(longUrl).host;

  logger.info(
    { ownerSub: user.sub, shortCode: url.shortCode, customSlug: url.customSlug, longUrlHost },
    "Short URL created",
  );

  const body: CreateLinkResponse = {
    success: true,
    longUrl,
    shortCode: url.shortCode,
    customSlug: url.customSlug,
    shortUrl,
  };

  return c.json(body);
});

app.onError((error, c) => {
  if (error instanceof CustomSlugUnavailableError) {
    logger.info({ customSlug: error.customSlug }, "Custom slug already exists");
    const body: ErrorResponse = { success: false, error: "Custom slug already exists" };
    return c.json(body, 409);
  }

  throw error;
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
    if (!isUrlPathSegment(shortCode)) {
      logger.warn({ shortCode }, "Invalid short code requested");
      const body: ErrorResponse = { success: false, error: "Invalid short code" };
      return c.json(body, 400);
    }

    const mode = c.req.valid("query").mode;
    const url =
      mode === "info"
        ? await getOwnedShortUrl(shortCode, c.get("authUser").sub)
        : await getFromShortUrl(shortCode);
    if (!url) {
      logger.info({ shortCode }, "Short URL not found");
      const body: ErrorResponse = { success: false, error: "Short URL not found" };
      return c.json(body, 404);
    }

    if (mode === "info") {
      const body: GetLinkInfoResponse = {
        success: true,
        shortCode: url.shortCode,
        customSlug: url.customSlug,
        longUrl: url.longUrl,
      };

      return c.json(body);
    }

    return c.redirect(url.longUrl);
  },
);

export default app;
