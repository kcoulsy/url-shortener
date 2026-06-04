import { redirect } from "@sveltejs/kit";
import { clearAuthCookies } from "$server/auth/session.server";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies }) => {
  clearAuthCookies(cookies);
  throw redirect(303, "/login");
};
