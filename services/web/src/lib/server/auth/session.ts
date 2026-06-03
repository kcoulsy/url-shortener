import { dev } from "$app/environment";
import type { Cookies, RequestEvent } from "@sveltejs/kit";
import { refreshAuthTokens, type AuthTokens } from "./cognito";

const accessTokenCookie = "access_token";
const idTokenCookie = "id_token";
const refreshTokenCookie = "refresh_token";

const tokenCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: !dev,
};

export type AuthUser = {
  email?: string;
  sub: string;
  username?: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

type JwtPayload = {
  aud?: string;
  client_id?: string;
  email?: string;
  exp?: number;
  sub?: string;
  username?: string;
  "cognito:username"?: string;
};

function decodeJwt(token: string): JwtPayload | undefined {
  const [, payload] = token.split(".");
  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    return undefined;
  }
}

function isExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp <= Math.floor(Date.now() / 1000) + 30;
}

function userFromIdToken(idToken: string): AuthUser | undefined {
  const payload = decodeJwt(idToken);
  if (!payload?.sub) {
    return undefined;
  }

  return {
    email: payload.email,
    sub: payload.sub,
    username: payload["cognito:username"] ?? payload.username,
  };
}

export function setAuthCookies(cookies: Cookies, tokens: AuthTokens): void {
  cookies.set(accessTokenCookie, tokens.AccessToken, {
    ...tokenCookieOptions,
    maxAge: 60 * 60,
  });
  cookies.set(idTokenCookie, tokens.IdToken, {
    ...tokenCookieOptions,
    maxAge: 60 * 60,
  });
  cookies.set(refreshTokenCookie, tokens.RefreshToken, {
    ...tokenCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

function setRefreshedCookies(
  cookies: Cookies,
  tokens: Omit<AuthTokens, "RefreshToken">,
  refreshToken: string,
): void {
  setAuthCookies(cookies, { ...tokens, RefreshToken: refreshToken });
}

export function clearAuthCookies(cookies: Cookies): void {
  cookies.delete(accessTokenCookie, { path: "/" });
  cookies.delete(idTokenCookie, { path: "/" });
  cookies.delete(refreshTokenCookie, { path: "/" });
}

export async function getAuthSession(event: RequestEvent): Promise<AuthSession | undefined> {
  let accessToken = event.cookies.get(accessTokenCookie);
  let idToken = event.cookies.get(idTokenCookie);
  const refreshToken = event.cookies.get(refreshTokenCookie);

  if ((!accessToken || !idToken || isExpired(accessToken) || isExpired(idToken)) && refreshToken) {
    try {
      const refreshed = await refreshAuthTokens(refreshToken);
      accessToken = refreshed.AccessToken;
      idToken = refreshed.IdToken;
      setRefreshedCookies(event.cookies, refreshed, refreshToken);
    } catch {
      clearAuthCookies(event.cookies);
      return undefined;
    }
  }

  if (!accessToken || !idToken || isExpired(accessToken) || isExpired(idToken)) {
    return undefined;
  }

  const user = userFromIdToken(idToken);
  if (!user) {
    return undefined;
  }

  return { accessToken, user };
}
