/** Algorithm Auth0 uses for RS-signed JWT access tokens. */
export const AUTH0_JWT_SIGNING_ALGORITHM = 'RS256' as const;

/** Standard Auth0 JWKS document path (RFC 8414 style, fixed by Auth0). */
export const AUTH0_JWKS_WELL_KNOWN_PATH = '/.well-known/jwks.json' as const;
