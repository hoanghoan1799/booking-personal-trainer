const AUTH0_LINKING_PENDING_KEY = "bpt_auth0_linking_pending";
const AUTH0_LINKING_PENDING_AT_KEY = "bpt_auth0_linking_pending_at";
/** After this many ms the blocker is ignored so a stuck redirect cannot lock the UI forever. */
export const AUTH0_LINKING_PENDING_TTL_MS = 12_000;

export function setAuth0LinkingPending(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(AUTH0_LINKING_PENDING_KEY, "1");
  sessionStorage.setItem(AUTH0_LINKING_PENDING_AT_KEY, String(Date.now()));
}

export function clearAuth0LinkingPending(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(AUTH0_LINKING_PENDING_KEY);
  sessionStorage.removeItem(AUTH0_LINKING_PENDING_AT_KEY);
}

export function isAuth0LinkingPending(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(AUTH0_LINKING_PENDING_KEY) !== "1") {
    return false;
  }
  const startedAtRaw = sessionStorage.getItem(AUTH0_LINKING_PENDING_AT_KEY);
  const startedAt = startedAtRaw ? Number(startedAtRaw) : NaN;
  if (
    Number.isNaN(startedAt) ||
    Date.now() - startedAt > AUTH0_LINKING_PENDING_TTL_MS
  ) {
    clearAuth0LinkingPending();
    return false;
  }
  return true;
}

