import { fail, redirect } from "@sveltejs/kit";
import { signUpUser } from "$lib/server/auth/cognito";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, "/");
  }
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      return fail(400, { email, error: "Email and password are required." });
    }

    try {
      await signUpUser(email, password);
    } catch {
      return fail(400, { email, error: "Could not create that account." });
    }

    throw redirect(303, `/confirm?email=${encodeURIComponent(email)}`);
  },
};
