import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

const mergeSetCookieHeaders = (from: NextResponse, into: NextResponse): void => {
  const cookies = from.headers.getSetCookie();
  for (const cookie of cookies) {
    into.headers.append("Set-Cookie", cookie);
  }
};

/**
 * Uses the Auth0 session to obtain a JWT for Nest exchange. Prefers the ID token when
 * present (typically includes email for openid email scope); otherwise uses the access token.
 * Forwards Set-Cookie from Auth0 when the access token is refreshed.
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const session = await auth0.getSession(req);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const cookieResponse = new NextResponse();
  let auth0Token: string | undefined = session.tokenSet?.idToken;
  if (auth0Token) {
    try {
      await auth0.getAccessToken(req, cookieResponse);
    } catch {
      /* session may still be valid with ID token only */
    }
  } else {
    try {
      const { token } = await auth0.getAccessToken(req, cookieResponse);
      auth0Token = token;
    } catch {
      auth0Token = session.tokenSet?.accessToken ?? undefined;
    }
  }
  if (!auth0Token) {
    return NextResponse.json(
      { message: "No Auth0 access or ID token in session" },
      { status: 401 },
    );
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 },
    );
  }

console.log('auth0Token',auth0Token);

  const apiRes = await fetch(`${apiUrl}/api/v1/auth/auth0/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth0Token }),
  });
  const payload: unknown = await apiRes.json().catch(() => ({}));
  const response = NextResponse.json(payload, { status: apiRes.status });
  mergeSetCookieHeaders(cookieResponse, response);
  return response;
};
