const AUTH0_SIGNOUT_PENDING_KEY = "bpt_auth0_signout_pending";
const AUTH0_SIGNOUT_PENDING_AT_KEY = "bpt_auth0_signout_pending_at";
/** After this many ms the flag is ignored so an abandoned logout cannot block Auth0 exchange forever. */
export const AUTH0_SIGNOUT_PENDING_TTL_MS = 8_000;

/**
 * Set while Auth0 federated logout is in progress so the app does not call GET /auth/profile
 * after Nest tokens are cleared but before navigation to /auth/logout completes.
 */
export function setAuth0SignOutPending(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(AUTH0_SIGNOUT_PENDING_KEY, "1");
  sessionStorage.setItem(AUTH0_SIGNOUT_PENDING_AT_KEY, String(Date.now()));
}

export function clearAuth0SignOutPending(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(AUTH0_SIGNOUT_PENDING_KEY);
  sessionStorage.removeItem(AUTH0_SIGNOUT_PENDING_AT_KEY);
}

export function isAuth0SignOutPending(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(AUTH0_SIGNOUT_PENDING_KEY) !== "1") {
    return false;
  }
  const startedAtRaw = sessionStorage.getItem(AUTH0_SIGNOUT_PENDING_AT_KEY);
  const startedAt = startedAtRaw ? Number(startedAtRaw) : NaN;
  if (
    Number.isNaN(startedAt) ||
    Date.now() - startedAt > AUTH0_SIGNOUT_PENDING_TTL_MS
  ) {
    clearAuth0SignOutPending();
    return false;
  }
  return true;
}
