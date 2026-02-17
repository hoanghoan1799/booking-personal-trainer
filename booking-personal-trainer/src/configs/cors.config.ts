import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Cross-Origin Resource Sharing (CORS) configuration.
 *
 * CORS is a security mechanism that allows web pages to make requests to a different domain
 * than the one serving the web page. This configuration controls which origins can access
 * your API and what operations they can perform.
 *
 * Security Notes:
 * - When `credentials: true`, you CANNOT use `origin: '*'` - browsers will reject it.
 * - Always specify exact origins in production for better security.
 * - Consider using environment-specific configurations (dev vs prod).
 */
export const CORS_CONFIG: CorsOptions = {
  /**
   * `origin`
   *
   * Purpose:
   * - Controls which origins (scheme + domain + port) are allowed to make requests to your API.
   *
   * Current implementation:
   * - Uses `FRONTEND_URL` environment variable if set (recommended for production).
   * - In development: allows common localhost origins for easier testing.
   * - In production without `FRONTEND_URL`: rejects all origins (security by default).
   *
   * Important:
   * - When `credentials: true`, `origin: '*'` or `origin: true` is NOT allowed by browsers.
   * - You MUST specify exact origins when using credentials.
   * - For production, always set `FRONTEND_URL` to your frontend domain (e.g., 'https://example.com').
   *
   * Advanced usage:
   * - Can be a function: `(origin, callback) => callback(null, true)` for dynamic validation.
   * - Can be an array: `['https://app1.com', 'https://app2.com']` for multiple origins.
   * - Can be a regex: `/^https:\/\/.*\.example\.com$/` for pattern matching.
   */
  origin: (() => {
    const frontendUrl = process.env.FRONTEND_URL;
    const isProduction = process.env.NODE_ENV === 'production';

    // Production: require FRONTEND_URL to be set
    if (isProduction) {
      if (!frontendUrl) {
        console.warn(
          '⚠️  CORS: FRONTEND_URL not set in production. CORS will reject all origins.',
        );
        return false;
      }
      return frontendUrl;
    }

    // Development: allow localhost origins if FRONTEND_URL is not set
    if (!frontendUrl) {
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
    }

    return frontendUrl;
  })(),

  /**
   * `credentials`
   *
   * Purpose:
   * - Controls whether cookies, authorization headers, and TLS client certificates
   *   can be sent with cross-origin requests.
   *
   * Current value:
   * - `true`: allows credentials to be included in cross-origin requests.
   *
   * Why it's needed:
   * - Allows credentials (e.g. cookies) to be sent with cross-origin requests if needed.
   * - Authentication uses Bearer tokens in Authorization header.
   *
   * Security consideration:
   * - When `credentials: true`, you MUST specify exact origins (cannot use '*').
   * - This ensures cookies are only sent to trusted origins.
   */
  credentials: true,

  /**
   * `methods`
   *
   * Purpose:
   * - Specifies which HTTP methods are allowed for cross-origin requests.
   *
   * Current value:
   * - Defaults to common REST API methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
   *
   * Why it's useful:
   * - Restricts which HTTP verbs can be used, reducing attack surface.
   * - OPTIONS is included for preflight requests (required by CORS).
   */
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  /**
   * `allowedHeaders`
   *
   * Purpose:
   * - Specifies which HTTP headers can be used in cross-origin requests.
   *
   * Current value:
   * - Common headers needed for REST APIs and authentication.
   *
   * Headers explained:
   * - `Content-Type`: Required for POST/PUT requests with JSON bodies.
   * - `Authorization`: Required if you use Bearer tokens (alternative to cookies).
   * - `X-Requested-With`: Used by some frameworks to identify AJAX requests.
   * - `Accept`: Allows clients to specify response format preferences.
   *
   * Note:
   * - You can use `'*'` to allow all headers, but it's less secure.
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],

  /**
   * `exposedHeaders`
   *
   * Purpose:
   * - Specifies which response headers can be accessed by JavaScript in the browser.
   *
   * Current value:
   * - Empty array (no custom headers exposed).
   *
   * When to use:
   * - If your API returns custom headers (e.g., `X-Total-Count` for pagination),
   *   add them here so frontend can read them.
   * - Standard headers (Content-Type, etc.) are always accessible.
   */
  exposedHeaders: [],

  /**
   * `maxAge`
   *
   * Purpose:
   * - Specifies how long (in seconds) the browser can cache the result of a preflight request.
   *
   * Current value:
   * - `86400` (24 hours): reduces the number of preflight requests.
   *
   * How it works:
   * - When a browser makes a "complex" CORS request (e.g., POST with custom headers),
   *   it first sends an OPTIONS request (preflight).
   * - The browser caches the preflight response for `maxAge` seconds.
   * - Subsequent requests within this window skip the preflight.
   *
   * Trade-off:
   * - Longer cache = fewer preflight requests = better performance.
   * - But changes to CORS config won't take effect until cache expires.
   */
  maxAge: 86400, // 24 hours

  /**
   * `preflightContinue`
   *
   * Purpose:
   * - Controls whether to pass the OPTIONS preflight request to the next handler.
   *
   * Current value:
   * - `false`: NestJS handles the preflight automatically (recommended).
   *
   * When to set `true`:
   * - Only if you need custom preflight handling logic.
   * - Most applications should leave this as `false`.
   */
  preflightContinue: false,

  /**
   * `optionsSuccessStatus`
   *
   * Purpose:
   * - HTTP status code to return for successful OPTIONS requests.
   *
   * Current value:
   * - `204` (No Content): standard status for successful preflight requests.
   *
   * Note:
   * - Some older browsers expect `200`, but `204` is the modern standard.
   */
  optionsSuccessStatus: 204,
};
