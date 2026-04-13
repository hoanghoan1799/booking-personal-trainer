import { setTokens } from "@/lib/token";
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

/**
 * Calls the Next.js route that exchanges the Auth0 session for Nest JWTs and stores them locally.
 */
export const syncAuth0SessionWithBackend = async (): Promise<void> => {
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
    throw new Error(message);
  }
  const wrapped = body as NestWrappedResponse;
  const data = wrapped.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid response from backend exchange");
  }
  setTokens(data.accessToken, data.refreshToken);
};
