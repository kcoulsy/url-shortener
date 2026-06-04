import { fail } from "@sveltejs/kit";
import { requireUserSession } from "$server/auth/guards.server";
import { urlsApiBase, urlsService } from "$server/services/urls/client.server";
import type { Actions, PageServerLoad } from "./$types";

const customSlugPattern = /^[0-9a-zA-Z_-]{3,64}$/;

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { accessToken, user } = requireUserSession(locals);
  const links = await urlsService(fetch, accessToken).listLinks();

  return {
    links,
    urlsBase: urlsApiBase(),
    user,
  };
};

export const actions: Actions = {
  create: async ({ fetch, locals, request }) => {
    const { accessToken } = requireUserSession(locals);
    const form = await request.formData();
    const url = String(form.get("url") ?? "").trim();
    const customSlug = String(form.get("customSlug") ?? "").trim();
    const customize = form.get("customize") === "true";
    const formState = { customSlug, customize, url };

    if (!url) {
      return fail(400, { ...formState, error: "Destination URL is required." });
    }

    if (customSlug && !customSlugPattern.test(customSlug)) {
      return fail(400, { ...formState, customize: true, error: "Invalid custom slug." });
    }

    try {
      const created = await urlsService(fetch, accessToken).createLink({
        url,
        ...(customSlug ? { customSlug } : {}),
      });
      return { created: created.shortUrl };
    } catch (error) {
      return fail(400, {
        ...formState,
        error: error instanceof Error ? error.message : "Could not create short link.",
      });
    }
  },
};
