import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  SignUpCommand,
  type AuthenticationResultType,
} from "@aws-sdk/client-cognito-identity-provider";
import { env } from "$env/dynamic/private";

function cognitoRegion(): string {
  return env.COGNITO_REGION || env.AWS_REGION || "us-east-1";
}

function cognitoClientId(): string {
  if (!env.COGNITO_CLIENT_ID) {
    throw new Error("COGNITO_CLIENT_ID is required for web auth");
  }

  return env.COGNITO_CLIENT_ID;
}

const client = new CognitoIdentityProviderClient({ region: cognitoRegion() });

export type AuthTokens = Required<
  Pick<AuthenticationResultType, "AccessToken" | "IdToken" | "RefreshToken">
>;

export async function signUpUser(email: string, password: string): Promise<void> {
  await client.send(
    new SignUpCommand({
      ClientId: cognitoClientId(),
      Password: password,
      Username: email,
      UserAttributes: [{ Name: "email", Value: email }],
    }),
  );
}

export async function confirmUser(email: string, code: string): Promise<void> {
  await client.send(
    new ConfirmSignUpCommand({
      ClientId: cognitoClientId(),
      ConfirmationCode: code,
      Username: email,
    }),
  );
}

export async function authenticateUser(email: string, password: string): Promise<AuthTokens> {
  const response = await client.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoClientId(),
      AuthParameters: {
        PASSWORD: password,
        USERNAME: email,
      },
    }),
  );

  const result = response.AuthenticationResult;
  if (!result?.AccessToken || !result.IdToken || !result.RefreshToken) {
    throw new Error("Cognito did not return a complete auth session");
  }

  return {
    AccessToken: result.AccessToken,
    IdToken: result.IdToken,
    RefreshToken: result.RefreshToken,
  };
}

export async function refreshAuthTokens(
  refreshToken: string,
): Promise<Omit<AuthTokens, "RefreshToken">> {
  const response = await client.send(
    new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: cognitoClientId(),
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    }),
  );

  const result = response.AuthenticationResult;
  if (!result?.AccessToken || !result.IdToken) {
    throw new Error("Cognito did not return refreshed auth tokens");
  }

  return {
    AccessToken: result.AccessToken,
    IdToken: result.IdToken,
  };
}
