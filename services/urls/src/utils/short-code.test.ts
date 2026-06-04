import { describe, expect, it } from "vitest";
import {
  createShortCode,
  isCustomSlug,
  isShortCode,
  isUrlPathSegment,
  shortCodeLength,
} from "./short-code.js";

describe("createShortCode", () => {
  it("creates 7 character alphanumeric short codes", () => {
    expect(createShortCode()).toMatch(/^[0-9a-zA-Z]{7}$/);
    expect(createShortCode()).toHaveLength(shortCodeLength);
  });
});

describe("isShortCode", () => {
  it("validates short code shape", () => {
    expect(isShortCode("abc123Z")).toBe(true);
    expect(isShortCode("abc123")).toBe(false);
    expect(isShortCode("abc123ZZ")).toBe(false);
    expect(isShortCode("abc-23Z")).toBe(false);
  });
});

describe("isCustomSlug", () => {
  it("validates custom slug shape", () => {
    expect(isCustomSlug("abc")).toBe(true);
    expect(isCustomSlug("summer-sale_2026")).toBe(true);
    expect(isCustomSlug("ab")).toBe(false);
    expect(isCustomSlug("abc.def")).toBe(false);
    expect(isCustomSlug("abc/def")).toBe(false);
    expect(isCustomSlug("a".repeat(65))).toBe(false);
  });
});

describe("isUrlPathSegment", () => {
  it("accepts generated short codes and custom slugs", () => {
    expect(isUrlPathSegment("abc123Z")).toBe(true);
    expect(isUrlPathSegment("summer-sale")).toBe(true);
    expect(isUrlPathSegment("no.dots")).toBe(false);
  });
});
