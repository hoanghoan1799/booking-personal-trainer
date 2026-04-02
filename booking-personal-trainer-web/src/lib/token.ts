const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_COOKIE_NAME = "auth";
const AUTH_COOKIE_MAX_AGE_DAYS = 7;

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
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearAuthCookie();
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
