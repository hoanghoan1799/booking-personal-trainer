import { getAccessToken, clearTokens } from "./token";
import { getApiErrorMessage } from "./error.utils";
import { refreshAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FetchOptions = RequestInit & {
  /** When true (default), sends Authorization: Bearer <accessToken>. Use false only for public endpoints. */
  auth?: boolean;
  /** Internal: skip 401 refresh handling (used for refresh request itself). */
  _isRefresh?: boolean;
};

let refreshPromise: Promise<string> | null = null;

function performLogout(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/signin";
  }
}

async function doFetch<T>(
  endpoint: string,
  options: FetchOptions
): Promise<Response> {
  const { auth = true, headers, _isRefresh, ...rest } = options;
  const isFormDataBody =
    typeof FormData !== "undefined" && rest.body instanceof FormData;
  const defaultHeaders: HeadersInit = {
    ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
  };
  return fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...(auth && { Authorization: `Bearer ${getAccessToken()}` }),
      ...headers,
    } as HeadersInit,
    cache: "no-store",
  });
}

/**
 * Authenticated API fetch. Sends Authorization: Bearer <accessToken> for all requests
 * except when auth=false. On 401, automatically refreshes the access token and retries.
 * Logs out user when refresh token is expired.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const isRefreshRequest = endpoint.includes("token/refresh");
  const res = await doFetch(endpoint, options);

  if (res.status === 401 && options.auth !== false && !options._isRefresh) {
    if (isRefreshRequest) {
      performLogout();
      throw new Error("Session expired. Please sign in again.");
    }

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;

      const retryHeaders = new Headers(options.headers ?? {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryRes = await doFetch(endpoint, {
        ...options,
        headers: retryHeaders,
      } as FetchOptions);

      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => null);
        const message = getApiErrorMessage(body) || "Something went wrong";
        throw new Error(message);
      }

      return retryRes.json() as Promise<T>;
    } catch (err) {
      refreshPromise = null;
      performLogout();
      throw err instanceof Error
        ? err
        : new Error("Session expired. Please sign in again.");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = getApiErrorMessage(body) || "Something went wrong";
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
