const ensureLeadingSlash = (value: string): string =>
  value && !value.startsWith("/") ? `/${value}` : value;

const ensureNoLeadingSlash = (value: string): string =>
  value && value.startsWith("/") ? value.substring(1) : value;

const normalizeWithBasePath = (path: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  if (!basePath) {
    return path;
  }
  const sanitized = ensureLeadingSlash(basePath);
  const withTrailing = sanitized.endsWith("/") ? sanitized : `${sanitized}/`;
  return withTrailing + ensureNoLeadingSlash(path);
};

/** GET route served by Auth0 middleware (session user JSON or 401/204). */
export const AUTH0_PROFILE_ROUTE: string = normalizeWithBasePath(
  process.env.NEXT_PUBLIC_PROFILE_ROUTE || "/auth/profile",
);
