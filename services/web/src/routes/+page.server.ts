import { env } from "$env/dynamic/public";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

type Link = {
  createdAt: string;
  longUrl: string;
  shortCode: string;
};

type LinksResponse = { success: true; links: Link[] } | { success: false; error: string };

type CreateResponse =
  | { success: true; longUrl: string; shortCode: string; shortUrl: string }
  | { success: false; error: string };

function requireSession(locals: App.Locals): {
  accessToken: string;
  user: NonNullable<App.Locals["user"]>;
} {
  if (!locals.user || !locals.accessToken) {
    throw redirect(303, "/login");
  }

  return { accessToken: locals.accessToken, user: locals.user };
}

function urlsApiBase(): string {
  return env.PUBLIC_URLS_URL || "http://localhost:3000";
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { accessToken, user } = requireSession(locals);
  const response = await fetch(`${urlsApiBase()}/urls`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body = (await response.json()) as LinksResponse;

  return {
    links: body.success ? body.links : [],
    user,
  };
};

export const actions: Actions = {
  create: async ({ fetch, locals, request }) => {
    const { accessToken } = requireSession(locals);
    const form = await request.formData();
    const url = String(form.get("url") ?? "").trim();

    if (!url) {
      return fail(400, { error: "Destination URL is required.", url });
    }

    const response = await fetch(`${urlsApiBase()}/urls`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    const body = (await response.json()) as CreateResponse;

    if (!response.ok || !body.success) {
      return fail(response.status, {
        error: body.success ? "Could not create short link." : body.error,
        url,
      });
    }

    return { created: body.shortUrl };
  },
};
