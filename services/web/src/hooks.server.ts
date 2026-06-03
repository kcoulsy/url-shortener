import type { Handle } from "@sveltejs/kit";
import { getAuthSession } from "$lib/server/auth/session";

export const handle: Handle = async ({ event, resolve }) => {
  const session = await getAuthSession(event);
  event.locals.user = session?.user;
  event.locals.accessToken = session?.accessToken;

  return resolve(event);
};
