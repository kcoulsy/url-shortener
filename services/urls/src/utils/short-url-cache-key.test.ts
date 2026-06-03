import { describe, expect, it } from "vitest";
import { shortUrlCacheKey } from "./short-url-cache-key.js";

describe("shortUrlCacheKey", () => {
  it("formats short URL cache keys", () => {
    expect(shortUrlCacheKey("abc123Z")).toBe("short-url:abc123Z");
  });
});
