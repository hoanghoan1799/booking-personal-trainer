import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SdkError } from "@auth0/nextjs-auth0/errors";
import { NextResponse } from "next/server";
import type {
  AuthorizationParameters,
  OnCallbackContext,
  SessionData,
} from "@auth0/nextjs-auth0/types";

/**
 * Ensures OIDC scopes are always requested. Fixes empty AUTH0_SCOPE="" (still set in env)
 * wiping scopes, and aligns with SDK defaults (includes offline_access for refresh).
 */
const mergeAuthorizationScope = (userScope: string): string => {
  const parts = new Set(
    userScope
      .split(/\s+/)
      .filter(Boolean)
      .map((segment) => segment.toLowerCase()),
  );
  for (const required of ["openid", "profile", "email", "offline_access"] as const) {
    parts.add(required);
  }
  return [...parts].join(" ");
};

const buildAuthorizationParameters = (): AuthorizationParameters => {
  const rawScope = process.env.AUTH0_SCOPE?.trim();
  const scope = mergeAuthorizationScope(
    rawScope && rawScope.length > 0 ? rawScope : "openid profile email",
  );
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  const prompt = process.env.AUTH0_AUTHORIZATION_PROMPT?.trim();
  const params: AuthorizationParameters = { scope };
  if (audience) {
    params.audience = audience;
  }
  if (prompt) {
    params.prompt = prompt;
  }
  return params;
};

const buildAppBaseUrl = (): string | undefined => {
  const fromV4 = process.env.APP_BASE_URL;
  if (fromV4) {
    return fromV4;
  }
  const legacy = process.env.AUTH0_BASE_URL;
  return legacy ?? undefined;
};

const handleCallback = async (
  error: SdkError | null,
  ctx: OnCallbackContext,
  session: SessionData | null,
): Promise<NextResponse> => {
  const errorCode = error && "code" in error ? String(error.code) : "";
  const errorMessage = error ? String(error.message ?? "") : "";
  const rawCause = (error as Error & { cause?: unknown })?.cause;
  const causeCode =
    rawCause && typeof rawCause === "object" && "code" in rawCause
      ? String((rawCause as { code?: unknown }).code ?? "")
      : "";
  const hasAccessDenied =
    errorCode === "access_denied" ||
    causeCode === "access_denied" ||
    errorMessage.toLowerCase().includes("access_denied") ||
    errorMessage.toLowerCase().includes("did not authorize");
  const base = ctx.appBaseUrl ?? buildAppBaseUrl() ?? "";
  if (hasAccessDenied) {
    return NextResponse.redirect(new URL("/signin?auth0=cancelled", base));
  }
  if (error) {
    return NextResponse.json(
      {
        error: errorCode,
        errorDescription: errorMessage,
        cause: rawCause ?? null,
      },
      { status: 400 },
    );
  }
  if (!session) {
    return NextResponse.redirect(new URL("/signin", base));
  }
  return NextResponse.redirect(new URL(ctx.returnTo ?? "/", base));
};

/**
 * Shared Auth0 client for middleware, server components, and route handlers.
 * Uses AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, and APP_BASE_URL from the environment.
 */
export const auth0 = new Auth0Client({
  appBaseUrl: buildAppBaseUrl(),
  authorizationParameters: buildAuthorizationParameters(),
  onCallback: handleCallback,
});
