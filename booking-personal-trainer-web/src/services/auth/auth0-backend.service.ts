import { setAuthSessionMethod, setTokens } from "@/lib/token";
import { getApiErrorMessage } from "@/lib/error.utils";

type BackendAuthPayload = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly userName: string;
  };
};

type NestWrappedResponse = {
  readonly data?: BackendAuthPayload;
};

export type Auth0BackendSyncResult =
  | { readonly kind: "linked" }
  | { readonly kind: "account_link_required" };

const hasAccountLinkRequiredMessage = (message: string): boolean => {
  return message.includes("ACCOUNT_LINK_REQUIRED");
};

/**
 * Calls the Next.js route that exchanges the Auth0 session for Nest JWTs and stores them locally.
 */
export const syncAuth0SessionWithBackend =
  async (): Promise<Auth0BackendSyncResult> => {
  const res = await fetch("/api/auth/exchange-backend", {
    method: "POST",
    credentials: "include",
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      getApiErrorMessage(body) ||
      (typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as { message: unknown }).message === "string" &&
        (body as { message: string }).message) ||
      `Backend exchange failed (${res.status})`;
    if (hasAccountLinkRequiredMessage(message)) {
      return { kind: "account_link_required" };
    }
    throw new Error(message);
  }
  const wrapped = body as NestWrappedResponse;
  const data = wrapped.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid response from backend exchange");
  }
  setTokens(data.accessToken, data.refreshToken);
  setAuthSessionMethod("auth0");
  return { kind: "linked" };
};

export const linkAuth0ToLocal = async (args: {
  readonly password: string;
}): Promise<void> => {
  const res = await fetch("/api/auth/link-auth0", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: args.password }),
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      getApiErrorMessage(body) ||
      (typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as { message: unknown }).message === "string" &&
        (body as { message: string }).message) ||
      `Backend link failed (${res.status})`;
    throw new Error(message);
  }
  const wrapped = body as NestWrappedResponse;
  const data = wrapped.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid response from backend link");
  }
  setTokens(data.accessToken, data.refreshToken);
  setAuthSessionMethod("auth0");
};
