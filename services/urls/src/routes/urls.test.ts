import { beforeEach, describe, expect, it, vi } from "vitest";
import "../utils/test-setup.js";
import { analyticsEvents, db, urls } from "@aws-project/db";
import { publishRedirectEvent } from "../analytics/publisher.js";
import { redis } from "../cache/client.js";
import { shortUrlCacheKey } from "../utils/short-url-cache-key.js";
import app from "./urls.js";

vi.mock("../analytics/publisher.js", () => ({
  publishRedirectEvent: vi.fn(),
}));

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
  beforeEach(() => {
    vi.mocked(publishRedirectEvent).mockReset();
    vi.mocked(publishRedirectEvent).mockResolvedValue(undefined);
  });

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
      customSlug: string | null;
      shortUrl: string;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      longUrl,
      shortCode: expect.stringMatching(/^[0-9a-zA-Z]{7}$/),
      customSlug: null,
      shortUrl: `http://localhost/urls/${body.shortCode}`,
    });

    const [stored] = await db.select().from(urls);
    expect(stored).toMatchObject({
      longUrl,
      shortCode: body.shortCode,
      customSlug: null,
      ownerSub: "user-1",
    });

    const cached = await redis.get(shortUrlCacheKey(body.shortCode));
    expect(cached).toBe(
      JSON.stringify({
        id: stored.id.toString(),
        shortCode: body.shortCode,
        longUrl,
        customSlug: null,
      }),
    );
  });

  it("creates a custom slug while still generating a short code", async () => {
    const longUrl = "https://example.com/articles/custom-slug";
    const response = await app.request("http://localhost/urls", {
      method: "POST",
      headers: { "content-type": "application/json", ...authorization() },
      body: JSON.stringify({ url: longUrl, customSlug: "summer-sale" }),
    });
    const body = (await response.json()) as {
      success: boolean;
      longUrl: string;
      shortCode: string;
      customSlug: string;
      shortUrl: string;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      longUrl,
      shortCode: expect.stringMatching(/^[0-9a-zA-Z]{7}$/),
      customSlug: "summer-sale",
      shortUrl: "http://localhost/urls/summer-sale",
    });

    const [stored] = await db.select().from(urls);
    expect(stored).toMatchObject({
      longUrl,
      shortCode: body.shortCode,
      customSlug: "summer-sale",
      ownerSub: "user-1",
    });
    expect(body.shortCode).not.toBe("summer-sale");

    const payload = JSON.stringify({
      id: stored.id.toString(),
      shortCode: body.shortCode,
      longUrl,
      customSlug: "summer-sale",
    });
    await expect(redis.get(shortUrlCacheKey(body.shortCode))).resolves.toBe(payload);
    await expect(redis.get(shortUrlCacheKey("summer-sale"))).resolves.toBe(payload);
  });

  it("returns 409 when a custom slug is unavailable", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Taken01", customSlug: "claimed", longUrl: "https://example.com/old" });

    const response = await app.request("/urls", {
      method: "POST",
      headers: { "content-type": "application/json", ...authorization() },
      body: JSON.stringify({ url: "https://example.com/new", customSlug: "claimed" }),
    });

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Custom slug already exists",
    });
    expect(response.status).toBe(409);
  });

  it("rejects invalid custom slugs", async () => {
    const response = await app.request("/urls", {
      method: "POST",
      headers: { "content-type": "application/json", ...authorization() },
      body: JSON.stringify({ url: "https://example.com/new", customSlug: "bad.slug" }),
    });

    expect(response.status).toBe(400);
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

  it("lists click stats for the authenticated user's URLs", async () => {
    const [activeLink, quietLink, otherUserLink] = await db
      .insert(urls)
      .values([
        { shortCode: "Mine001", longUrl: "https://example.com/mine", ownerSub: "user-1" },
        { shortCode: "Quiet01", longUrl: "https://example.com/quiet", ownerSub: "user-1" },
        { shortCode: "Else001", longUrl: "https://example.com/else", ownerSub: "user-2" },
      ])
      .returning();
    const firstClickAt = new Date("2026-01-01T10:00:00.000Z");
    const latestClickAt = new Date("2026-01-02T10:00:00.000Z");

    await db.insert(analyticsEvents).values([
      {
        urlId: activeLink.id,
        shortCode: activeLink.shortCode,
        pathSegment: activeLink.shortCode,
        occurredAt: firstClickAt,
      },
      {
        urlId: activeLink.id,
        shortCode: activeLink.shortCode,
        pathSegment: activeLink.shortCode,
        occurredAt: latestClickAt,
      },
      {
        urlId: otherUserLink.id,
        shortCode: otherUserLink.shortCode,
        pathSegment: otherUserLink.shortCode,
        occurredAt: new Date("2026-01-03T10:00:00.000Z"),
      },
    ]);

    const response = await app.request("/urls", { headers: authorization() });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      links: expect.arrayContaining([
        expect.objectContaining({
          shortCode: activeLink.shortCode,
          longUrl: activeLink.longUrl,
          clickCount: 2,
          lastClickedAt: latestClickAt.toISOString(),
        }),
        expect.objectContaining({
          shortCode: quietLink.shortCode,
          longUrl: quietLink.longUrl,
          clickCount: 0,
          lastClickedAt: null,
        }),
      ]),
    });
    expect(body.links).toHaveLength(2);
    expect(body.links).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ shortCode: otherUserLink.shortCode })]),
    );
  });

  it("returns URL info for an existing short code", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Abc123Z", longUrl: "https://example.com/info", ownerSub: "user-1" });

    const response = await app.request("/urls/Abc123Z?mode=info", { headers: authorization() });

    await expect(response.json()).resolves.toEqual({
      success: true,
      shortCode: "Abc123Z",
      customSlug: null,
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

  it("returns URL info for a custom slug owned by the authenticated user", async () => {
    await db.insert(urls).values({
      shortCode: "Slug001",
      customSlug: "docs",
      longUrl: "https://example.com/docs",
      ownerSub: "user-1",
    });

    const response = await app.request("/urls/docs?mode=info", { headers: authorization() });

    await expect(response.json()).resolves.toEqual({
      success: true,
      shortCode: "Slug001",
      customSlug: "docs",
      longUrl: "https://example.com/docs",
    });
    expect(response.status).toBe(200);
  });

  it("redirects to the long URL by default", async () => {
    await db.insert(urls).values({ shortCode: "Rdr123Z", longUrl: "https://example.com/redirect" });

    const response = await app.request("/urls/Rdr123Z");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/redirect");
    expect(publishRedirectEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        pathSegment: "Rdr123Z",
        shortCode: "Rdr123Z",
      }),
    );
  });

  it("redirects to the long URL when redirect mode is explicit", async () => {
    await db.insert(urls).values({ shortCode: "Mode123", longUrl: "https://example.com/mode" });

    const response = await app.request("/urls/Mode123?mode=redirect");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/mode");
  });

  it("does not wait for analytics publishing before redirecting", async () => {
    vi.mocked(publishRedirectEvent).mockRejectedValueOnce(new Error("sqs unavailable"));
    await db.insert(urls).values({ shortCode: "Fast123", longUrl: "https://example.com/fast" });

    const response = await app.request("/urls/Fast123");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/fast");
  });

  it("redirects custom slugs to the long URL", async () => {
    await db
      .insert(urls)
      .values({ shortCode: "Slug001", customSlug: "docs", longUrl: "https://example.com/docs" });

    const response = await app.request("/urls/docs");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/docs");
  });

  it("rejects invalid short codes", async () => {
    const response = await app.request("/urls/bad.slug");

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
