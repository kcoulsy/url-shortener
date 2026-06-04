import { randomInt } from "node:crypto";

export const shortCodeLength = 7;
export const customSlugMinLength = 3;
export const customSlugMaxLength = 64;

const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const shortCodePattern = new RegExp(`^[0-9a-zA-Z]{${shortCodeLength}}$`);
const customSlugPattern = new RegExp(
  `^[0-9a-zA-Z_-]{${customSlugMinLength},${customSlugMaxLength}}$`,
);

export function createShortCode(): string {
  let code = "";
  for (let i = 0; i < shortCodeLength; i++) {
    code += chars[randomInt(chars.length)];
  }

  return code;
}

export function isShortCode(code: string): boolean {
  return shortCodePattern.test(code);
}

export function isCustomSlug(slug: string): boolean {
  return customSlugPattern.test(slug);
}

export function isUrlPathSegment(segment: string): boolean {
  return isShortCode(segment) || isCustomSlug(segment);
}
