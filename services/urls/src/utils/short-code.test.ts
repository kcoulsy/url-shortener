import { describe, expect, it } from "vitest";
import { createShortCode, isShortCode, shortCodeLength } from "./short-code.js";

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
