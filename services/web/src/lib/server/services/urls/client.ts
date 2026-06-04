import { env } from "$env/dynamic/public";
import type { CreatedLink, CreateLinkResponse, Link, LinksResponse, ServiceLink } from "./types";

type ServerFetch = typeof fetch;

function urlsApiBase(): string {
  return env.PUBLIC_URLS_URL || "http://localhost:3000";
}

function publicShortUrl(shortCode: string): string {
  return new URL(`/urls/${shortCode}`, urlsApiBase()).toString();
}

function authHeaders(accessToken: string): HeadersInit {
  return { authorization: `Bearer ${accessToken}` };
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function toLink(link: ServiceLink): Link {
  return {
    ...link,
    shortUrl: publicShortUrl(link.shortCode),
  };
}

export function urlsService(serverFetch: ServerFetch, accessToken: string) {
  return {
    async listLinks(): Promise<Link[]> {
      const response = await serverFetch(`${urlsApiBase()}/urls`, {
        headers: authHeaders(accessToken),
      });
      const body = await readJson<LinksResponse>(response);

      return body.success ? body.links.map(toLink) : [];
    },

    async createLink(url: string): Promise<CreatedLink> {
      const response = await serverFetch(`${urlsApiBase()}/urls`, {
        method: "POST",
        headers: {
          ...authHeaders(accessToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const body = await readJson<CreateLinkResponse>(response);

      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Could not create short link." : body.error);
      }

      return { shortUrl: body.shortUrl || publicShortUrl(body.shortCode) };
    },
  };
}
