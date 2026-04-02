import { HelmetOptions } from 'helmet';

/**
 * Helmet security configuration.
 *
 * Helmet is an Express middleware that sets a collection of HTTP response headers to reduce
 * common web vulnerabilities (clickjacking, MIME sniffing, overly-permissive resource loading, etc.).
 *
 * Notes:
 * - `contentSecurityPolicy` (CSP) can break UIs that rely on inline scripts/styles (Swagger UI often does).
 *   If your `/api-docs` stops working, adjust `scriptSrc`/`styleSrc` for that route or relax CSP in non-prod.
 * - Most Helmet protections are enabled by default when you call `helmet()`. Here we customize a few.
 */
export const HELMET_CONFIG: Readonly<HelmetOptions> = {
  /**
   * Content Security Policy (CSP)
   *
   * Purpose:
   * - Mitigates XSS by restricting which sources the browser may load resources from.
   *
   * How it works:
   * - `directives` map to CSP directives (e.g. `default-src`, `script-src`, `img-src`).
   * - Each directive is a list of allowed sources.
   */
  contentSecurityPolicy: {
    directives: {
      /**
       * `default-src`
       *
       * Purpose:
       * - Baseline policy for resource types that do not have a more specific directive.
       *
       * Current value:
       * - `'self'`: only allow resources from the same origin (same scheme/host/port).
       */
      defaultSrc: ["'self'"],
      /**
       * `style-src`
       *
       * Purpose:
       * - Controls where CSS can be loaded from.
       *
       * Current value:
       * - `'self'`: allow stylesheets from same origin.
       * - `'unsafe-inline'`: allow inline styles (e.g. style attributes, <style> blocks).
       *
       * Trade-off:
       * - `'unsafe-inline'` weakens CSP; keep it only if you need it (some UI libs / Swagger may require it).
       */
      styleSrc: ["'self'", "'unsafe-inline'"],
      /**
       * `script-src`
       *
       * Purpose:
       * - Controls where JavaScript can be loaded/executed from (strongest XSS control).
       *
       * Current value:
       * - `'self'`: allow scripts served by your own origin only.
       *
       * Common adjustments:
       * - If Swagger UI or a frontend relies on inline scripts, you may need `'unsafe-inline'` or nonces.
       *   Prefer nonces/hashes over `'unsafe-inline'` when possible.
       */
      scriptSrc: ["'self'"],
      /**
       * `img-src`
       *
       * Purpose:
       * - Controls where images can be loaded from.
       *
       * Current value:
       * - `'self'`: same-origin images.
       * - `data:`: allow data-URI images (often used for small inline icons/avatars).
       * - `https:`: allow images from any HTTPS origin (useful for user-provided external images).
       *
       * Tightening tip:
       * - If you want stricter policy, replace `https:` with an explicit allowlist of domains.
       */
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  /**
   * Cross-Origin-Embedder-Policy (COEP)
   *
   * Purpose:
   * - Controls whether the document can load cross-origin resources that are not explicitly permitted.
   * - When enabled, it helps with isolation features like `SharedArrayBuffer`, but requires compatible headers
   *   on every embedded cross-origin resource (often causes breakage in typical APIs/admin tools).
   *
   * Current value:
   * - `false`: disables COEP to avoid blocking cross-origin embeds/resources.
   */
  crossOriginEmbedderPolicy: false,
  /**
   * Cross-Origin-Resource-Policy (CORP)
   *
   * Purpose:
   * - Controls who can load your resources in another origin's context (complements CORS; browser-enforced).
   *
   * Current value:
   * - `cross-origin`: allow other origins to load these resources.
   *
   * Tightening tip:
   * - Use `same-origin` or `same-site` if you want to reduce cross-origin resource usage.
   */
  crossOriginResourcePolicy: { policy: 'cross-origin' },
} as const;
