import { fail, redirect } from "@sveltejs/kit";
import { confirmUser } from "$server/auth/cognito.server";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    throw redirect(303, "/");
  }

  return { email: url.searchParams.get("email") ?? "" };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();

    if (!email || !code) {
      return fail(400, { code, email, error: "Email and confirmation code are required." });
    }

    try {
      await confirmUser(email, code);
    } catch {
      return fail(400, { code, email, error: "Could not confirm that account." });
    }

    throw redirect(303, "/login");
  },
};
