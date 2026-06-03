import { describe, expect, it } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import app from "./urls.js";

describe("urls routes", () => {
  it("creates a short URL with a real database row and Redis cache entry", async () => {
    const longUrl = "https://example.com/articles/full-test-coverage";
    const response = await app.request("http://localhost/urls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: longUrl }),
    });
    const body = (await response.json()) as {
      success: boolean;
      longUrl: string;
      shortCode: string;
      shortUrl: string;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      longUrl,
      shortCode: expect.stringMatching(/^[0-9a-zA-Z]{7}$/),
      shortUrl: `http://localhost/urls/${body.shortCode}`,
    });

    const [stored] = await db.select().from(urls);
    expect(stored).toMatchObject({ longUrl, shortCode: body.shortCode });

    const cached = await redis.get(shortUrlCacheKey(body.shortCode));
    expect(cached).toBe(JSON.stringify({ shortCode: body.shortCode, longUrl }));
  });

  it("rejects invalid URL JSON", async () => {
    const response = await app.request("/urls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns URL info for an existing short code", async () => {
    await db.insert(urls).values({ shortCode: "Abc123Z", longUrl: "https://example.com/info" });

    const response = await app.request("/urls/Abc123Z?mode=info");

    await expect(response.json()).resolves.toEqual({
      success: true,
      shortCode: "Abc123Z",
      longUrl: "https://example.com/info",
    });
    expect(response.status).toBe(200);
  });

  it("redirects to the long URL by default", async () => {
    await db.insert(urls).values({ shortCode: "Rdr123Z", longUrl: "https://example.com/redirect" });

    const response = await app.request("/urls/Rdr123Z");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/redirect");
  });

  it("redirects to the long URL when redirect mode is explicit", async () => {
    await db.insert(urls).values({ shortCode: "Mode123", longUrl: "https://example.com/mode" });

    const response = await app.request("/urls/Mode123?mode=redirect");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/mode");
  });

  it("rejects invalid short codes", async () => {
    const response = await app.request("/urls/not-valid");

    await expect(response.json()).resolves.toEqual({ success: false, error: "Invalid short code" });
    expect(response.status).toBe(400);
  });

  it("returns 404 for missing short codes", async () => {
    const response = await app.request("/urls/Miss123");

    await expect(response.json()).resolves.toEqual({ success: false, error: "Short URL not found" });
    expect(response.status).toBe(404);
  });
});
