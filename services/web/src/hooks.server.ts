import type { Handle } from "@sveltejs/kit";
import { getAuthSession } from "$server/auth/session.server";

export const handle: Handle = async ({ event, resolve }) => {
  const session = await getAuthSession(event);
  event.locals.user = session?.user;
  event.locals.accessToken = session?.accessToken;

  return resolve(event);
};
