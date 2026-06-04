import { env } from "$env/dynamic/public";
import type {
  CreateLinkRequest,
  CreateLinkResponse,
  ListLinksResponse,
  ServiceLink,
} from "@urls/types";

type ServerFetch = typeof fetch;

export type Link = ServiceLink & {
  shortUrl: string;
};

export type CreatedLink = {
  shortUrl: string;
};

export function urlsApiBase(): string {
  return env.PUBLIC_URLS_URL || "http://localhost:3000";
}

function publicShortUrl(link: Pick<ServiceLink, "customSlug" | "shortCode">): string {
  return new URL(`/urls/${link.customSlug ?? link.shortCode}`, urlsApiBase()).toString();
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
    shortUrl: publicShortUrl(link),
  };
}

export function urlsService(serverFetch: ServerFetch, accessToken: string) {
  return {
    async listLinks(): Promise<Link[]> {
      const response = await serverFetch(`${urlsApiBase()}/urls`, {
        headers: authHeaders(accessToken),
      });
      const body = await readJson<ListLinksResponse>(response);

      return body.success ? body.links.map(toLink) : [];
    },

    async createLink(input: CreateLinkRequest): Promise<CreatedLink> {
      const response = await serverFetch(`${urlsApiBase()}/urls`, {
        method: "POST",
        headers: {
          ...authHeaders(accessToken),
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const body = await readJson<CreateLinkResponse>(response);

      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Could not create short link." : body.error);
      }

      return { shortUrl: body.shortUrl || publicShortUrl(body) };
    },
  };
}
