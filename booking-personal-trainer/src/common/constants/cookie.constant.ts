export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
} as const;

export const COOKIE_SAME_SITE = {
  lax: 'lax',
  strict: 'strict',
  none: 'none',
} as const;
