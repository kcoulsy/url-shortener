import { randomInt } from "node:crypto";

export const shortCodeLength = 7;

const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const shortCodePattern = new RegExp(`^[0-9a-zA-Z]{${shortCodeLength}}$`);

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
