import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import { createMiddleware } from "hono/factory";

export type AuthUser = {
  sub: string;
  username?: string;
};

declare module "hono" {
  interface ContextVariableMap {
    authUser: AuthUser;
  }
}

type AccessTokenVerifier = ReturnType<typeof CognitoJwtVerifier.create>;

let verifier: AccessTokenVerifier | undefined;

function getVerifier(): AccessTokenVerifier {
  if (verifier) {
    return verifier;
  }

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required for URL auth");
  }

  verifier = CognitoJwtVerifier.create({
    clientId,
    tokenUse: "access",
    userPoolId,
  });

  return verifier;
}

function getBearerToken(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getBearerToken(c.req.header("authorization"));
  if (!token) {
    return c.json({ success: false, error: "Authentication required" }, 401);
  }

  try {
    const payload = (await getVerifier().verify(token)) as CognitoAccessTokenPayload;
    c.set("authUser", { sub: payload.sub, username: payload.username });
  } catch {
    return c.json({ success: false, error: "Invalid authentication token" }, 401);
  }

  return next();
});
