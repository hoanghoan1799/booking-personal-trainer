// Constants
import { ROUTES } from './route.constant';

export const COOKIE_SAME_SITE = {
  lax: 'lax',
  strict: 'strict',
  none: 'none',
} as const;

/**
 * Cookie options for authentication tokens.
 *
 * Using 'lax' instead of 'strict' to allow cookies to work when:
 * - Frontend and backend are on different subdomains (e.g., app.example.com and api.example.com)
 * - User navigates from external site to the app
 *
 * For cross-origin scenarios (completely different domains), you may need to:
 * - Set sameSite to 'none' and ensure secure: true
 * - Configure CORS properly with FRONTEND_URL environment variable
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: COOKIE_SAME_SITE.none,
  secure: true,
  path: ROUTES.ROOT,
} as const;
