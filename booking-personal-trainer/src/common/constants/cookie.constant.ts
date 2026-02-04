export const COOKIE_SAME_SITE = {
  lax: 'lax',
  strict: 'strict',
  none: 'none',
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: COOKIE_SAME_SITE.strict,
  secure: true,
} as const;
