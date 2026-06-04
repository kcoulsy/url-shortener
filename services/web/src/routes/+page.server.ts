import { fail } from "@sveltejs/kit";
import { requireUserSession } from "$lib/server/auth/guards";
import { urlsService } from "$lib/server/services";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { accessToken, user } = requireUserSession(locals);
  const links = await urlsService(fetch, accessToken).listLinks();

  return {
    links,
    user,
  };
};

export const actions: Actions = {
  create: async ({ fetch, locals, request }) => {
    const { accessToken } = requireUserSession(locals);
    const form = await request.formData();
    const url = String(form.get("url") ?? "").trim();

    if (!url) {
      return fail(400, { error: "Destination URL is required.", url });
    }

    try {
      const created = await urlsService(fetch, accessToken).createLink(url);
      return { created: created.shortUrl };
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : "Could not create short link.",
        url,
      });
    }
  },
};
