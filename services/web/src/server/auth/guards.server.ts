import { redirect } from "@sveltejs/kit";
import type { AuthSession } from "./session.server";

export function requireUserSession(locals: App.Locals): AuthSession {
  if (!locals.user || !locals.accessToken) {
    throw redirect(303, "/login");
  }

  return {
    accessToken: locals.accessToken,
    user: locals.user,
  };
}
