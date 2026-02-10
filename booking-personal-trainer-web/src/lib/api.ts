import { getAccessToken } from "./token";
import { getApiErrorMessage } from "./error.utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FetchOptions = RequestInit & {
  /** When true (default), sends Authorization: Bearer <accessToken>. Use false only for public endpoints. */
  auth?: boolean;
};

/**
 * Authenticated API fetch. Sends Authorization: Bearer <accessToken> for all requests
 * except when auth=false. Login and register must use raw fetch - they do not need a token.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(auth && { Authorization: `Bearer ${getAccessToken()}` }),
      ...headers,
    },
    credentials: "include", // ✅ để gửi cookie refreshToken
    cache: "no-store", // auth → không cache
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = getApiErrorMessage(body) || "Something went wrong";
    throw new Error(message);
  }

  return res.json();
}
