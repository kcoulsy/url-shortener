import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createShortCode } from "./utils.js";

const app = new Hono().basePath("/urls");

const UrlSchema = z.object({
  url: z.url(),
});

app.post("/", zValidator("json", UrlSchema), (c) => {
  const longUrl = c.req.valid("json").url;
  return c.json({ success: true, longUrl, shortUrl: createShortCode(longUrl) });
});

export default app;
