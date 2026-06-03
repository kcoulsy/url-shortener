import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { createShortCode, isShortCode } from "./utils.js";

const app = new Hono().basePath("/urls");

const UrlSchema = z.object({
  url: z.url(),
});

app.post("/", zValidator("json", UrlSchema), async (c) => {
  const longUrl = c.req.valid("json").url;
  const shortCode = await insertUrl(longUrl);

  const shortUrl = new URL(`/urls/${shortCode}`, c.req.url).toString();

  return c.json({ success: true, longUrl, shortCode, shortUrl });
});

app.get("/:code", async (c) => {
  const shortCode = c.req.param("code");
  if (!isShortCode(shortCode)) {
    return c.json({ success: false, error: "Invalid short code" }, 400);
  }

  const [url] = await db.select().from(urls).where(eq(urls.shortCode, shortCode)).limit(1);
  if (!url) {
    return c.json({ success: false, error: "Short URL not found" }, 404);
  }

  return c.redirect(url.longUrl);
});

async function insertUrl(longUrl: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = createShortCode();
    try {
      await db.insert(urls).values({ longUrl, shortCode });
      return shortCode;
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new Error("Could not generate a unique short code");
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export default app;
