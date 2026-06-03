import { describe, expect, it, vi } from "vitest";
import "../utils/test-setup.js";
import { redis } from "../cache/client.js";
import { db } from "../db/client.js";
import { urls } from "../db/schema.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import app from "./urls.js";

vi.mock("aws-jwt-verify", () => ({
  CognitoJwtVerifier: {
    create: () => ({
      verify: async (token: string) => {
        if (!token.startsWith("valid:")) {
          throw new Error("Invalid token");
        }

        return { sub: token.slice("valid:".length), username: "test-user" };
      },
    }),
  },
}));

function authorization(sub = "user-1") {
  return { authorization: `Bearer valid:${sub}` };
}

describe("urls routes", () => {
  it("creates a short URL with a real database row and Redis cache entry", async () => {
    const longUrl = "https://example.com/articles/full-test-coverage";
    const response = await app.request("http://localhost/urls", {
      method: "POST",
      headers: { "content-type": "application/json", ...authorization() },
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
    expect(stored).toMatchObject({ longUrl, shortCode: body.shortCode, ownerSub: "user-1" });

    const cached = await redis.get(shortUrlCacheKey(body.shortCode));
    expect(cached).toBe(JSON.stringify({ shortCode: body.shortCode, longUrl }));
  });

  it("rejects invalid URL JSON", async () => {
    const response = await app.request("/urls", {
      method: "POST",
      headers: { "content-type": "application/json", ...authorization() },
      body: JSON.stringify({ url: "not-a-url" }),
    });

    expect(response.status).toBe(400);
  });

  it("rejects URL creation without authentication", async () => {
    const response = await app.request("/urls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/private" }),
    });

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Authentication required",
    });
    expect(response.status).toBe(401);
  });

  it("rejects URL creation with an invalid token", async () => {
    const response = await app.request("/urls", {
      method: "POST",
      headers: { authorization: "Bearer nope", "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/private" }),
    });

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid authentication token",
    });
    expect(response.status).toBe(401);
  });

  it("lists URLs for the authenticated user", async () => {
    await db.insert(urls).values([
      { shortCode: "Mine001", longUrl: "https://example.com/mine", ownerSub: "user-1" },
      { shortCode: "Else001", longUrl: "https://example.com/else", ownerSub: "user-2" },
    ]);

    const response = await app.request("/urls", { headers: authorization() });

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      links: [{ shortCode: "Mine001", longUrl: "https://example.com/mine" }],
    });
    expect(response.status).toBe(200);
  });

  it("returns URL info for an existing short code", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Abc123Z", longUrl: "https://example.com/info", ownerSub: "user-1" });

    const response = await app.request("/urls/Abc123Z?mode=info", { headers: authorization() });

    await expect(response.json()).resolves.toEqual({
      success: true,
      shortCode: "Abc123Z",
      longUrl: "https://example.com/info",
    });
    expect(response.status).toBe(200);
  });

  it("does not return URL info owned by another user", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Other01", longUrl: "https://example.com/other", ownerSub: "user-2" });

    const response = await app.request("/urls/Other01?mode=info", { headers: authorization() });

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Short URL not found",
    });
    expect(response.status).toBe(404);
  });

  it("rejects URL info without authentication", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Info401", longUrl: "https://example.com/info", ownerSub: "user-1" });

    const response = await app.request("/urls/Info401?mode=info");

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Authentication required",
    });
    expect(response.status).toBe(401);
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

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Short URL not found",
    });
    expect(response.status).toBe(404);
  });
});
