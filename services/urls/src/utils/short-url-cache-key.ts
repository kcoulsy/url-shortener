export function shortUrlCacheKey(shortCode: string): string {
  return `short-url:${shortCode}`;
}
