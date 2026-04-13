const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_METHOD_KEY = "authSessionMethod";
const AUTH_COOKIE_NAME = "auth";
const AUTH_COOKIE_MAX_AGE_DAYS = 7;

const accessTokenListeners = new Set<() => void>();

/**
 * Subscribe to access token changes (same-tab updates from setTokens / clearTokens).
 */
export function subscribeAccessTokenChange(listener: () => void): () => void {
  accessTokenListeners.add(listener);
  return () => {
    accessTokenListeners.delete(listener);
  };
}

function emitAccessTokenChange(): void {
  accessTokenListeners.forEach((listener) => {
    listener();
  });
}

export type AuthSessionMethod = "auth0" | "credentials";

export function setAuthSessionMethod(method: AuthSessionMethod): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(AUTH_METHOD_KEY, method);
}

export function getAuthSessionMethod(): AuthSessionMethod | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(AUTH_METHOD_KEY);
  if (raw === "auth0" || raw === "credentials") {
    return raw;
  }
  return null;
}

function clearAuthSessionMethod(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(AUTH_METHOD_KEY);
}

export function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Stores both tokens and sets auth cookie for middleware to detect logged-in state.
 * Middleware cannot access localStorage, so we use a simple cookie as a flag.
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setAuthCookie();
  emitAccessTokenChange();
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearAuthSessionMethod();
  clearAuthCookie();
  emitAccessTokenChange();
}

function setAuthCookie(): void {
  if (typeof document === "undefined") return;
  const maxAge = AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
}
