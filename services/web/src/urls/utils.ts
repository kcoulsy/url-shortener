// Util to generate a base62 short code from a URL.
// This is a simple implementation
export function createShortCode(url: string): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  hash = hash >>> 0; // Encode the unsigned value so negative hashes are usable.

  let shortCode = "";
  while (hash > 0) {
    shortCode = chars[hash % 62] + shortCode;
    hash = Math.floor(hash / 62);
  }
  return shortCode || "0";
}
