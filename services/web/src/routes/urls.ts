import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createShortUrl } from "../mutations/create-short-url.js";
import { getFromShortUrl } from "../queries/get-from-short-url.js";
import { isShortCode } from "../utils/short-code.js";

const app = new Hono().basePath("/urls");

const UrlSchema = z.object({
  url: z.url(),
});

app.post("/", zValidator("json", UrlSchema), async (c) => {
  const longUrl = c.req.valid("json").url;
  const url = await createShortUrl(longUrl);
  const shortUrl = new URL(`/urls/${url.shortCode}`, c.req.url).toString();

  return c.json({ success: true, longUrl, shortCode: url.shortCode, shortUrl });
});

app.get("/:code", async (c) => {
  const shortCode = c.req.param("code");
  if (!isShortCode(shortCode)) {
    return c.json({ success: false, error: "Invalid short code" }, 400);
  }

  const url = await getFromShortUrl(shortCode);
  if (!url) {
    return c.json({ success: false, error: "Short URL not found" }, 404);
  }

  return c.redirect(url.longUrl);
});

export default app;
