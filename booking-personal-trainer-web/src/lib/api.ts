import { getAccessToken } from "./token";

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
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Something went wrong");
  }

  return res.json();
}
