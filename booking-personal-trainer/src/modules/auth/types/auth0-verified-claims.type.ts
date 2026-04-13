/** Standard OpenID / Auth0 profile fields we read after JWT verification. */
export type Auth0VerifiedClaims = {
  readonly sub: string;
  readonly email?: string;
  readonly name?: string;
  readonly given_name?: string;
  readonly family_name?: string;
};
