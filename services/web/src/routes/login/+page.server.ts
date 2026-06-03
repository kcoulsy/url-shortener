import { fail, redirect } from "@sveltejs/kit";
import { authenticateUser } from "$lib/server/auth/cognito";
import { setAuthCookies } from "$lib/server/auth/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, "/");
  }
};

export const actions: Actions = {
  default: async ({ cookies, request }) => {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      return fail(400, { email, error: "Email and password are required." });
    }

    try {
      const tokens = await authenticateUser(email, password);
      setAuthCookies(cookies, tokens);
    } catch {
      return fail(400, { email, error: "Could not sign in with those credentials." });
    }

    throw redirect(303, "/");
  },
};
