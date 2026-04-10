import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

type AuthorizationParams = {
  readonly audience?: string;
  readonly scope?: string;
};

const buildAuthorizationParams = (): AuthorizationParams => {
  const audience = process.env.AUTH0_AUDIENCE;
  const scope = process.env.AUTH0_SCOPE ?? "openid profile email";
  if (!audience) {
    return { scope };
  }
  return { audience, scope };
};

const auth0 = new Auth0Client({
  appBaseUrl: process.env.AUTH0_BASE_URL,
  authorizationParameters: buildAuthorizationParams(),
  onCallback: async (error, ctx, session) => {
    const errorCode = error && "code" in error ? String(error.code) : "";
    const errorMessage = error ? String(error.message ?? "") : "";
    const rawCause = (error as unknown as { cause?: unknown } | null)?.cause;
    const causeCode =
      rawCause && typeof rawCause === "object" && "code" in rawCause
        ? String((rawCause as { code?: unknown }).code ?? "")
        : "";
    const hasAccessDenied =
      errorCode === "access_denied" ||
      causeCode === "access_denied" ||
      errorMessage.toLowerCase().includes("access_denied") ||
      errorMessage.toLowerCase().includes("did not authorize");
    if (hasAccessDenied) {
      return NextResponse.redirect(
        new URL("/signin?auth0=cancelled", ctx.appBaseUrl ?? "/"),
      );
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
      return NextResponse.redirect(new URL("/signin", ctx.appBaseUrl ?? "/"));
    }
    return NextResponse.redirect(new URL(ctx.returnTo ?? "/", ctx.appBaseUrl ?? "/"));
  },
  routes: {
    login: "/api/auth/login",
    callback: "/api/auth/callback",
    logout: "/api/auth/logout",
  },
});

export const GET = async (req: Request): Promise<Response> => {
  return await auth0.middleware(req);
};

export const POST = async (req: Request): Promise<Response> => {
  return await auth0.middleware(req);
};

