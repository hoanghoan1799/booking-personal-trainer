import type { Auth0VerifiedClaims } from '../types/auth0-verified-claims.type';

/**
 * Derives first and last name from Auth0 token claims (multiple claim shapes).
 * @param claims Verified Auth0 ID token or access token claims.
 */
export const splitNameFromAuth0Claims = (
  claims: Auth0VerifiedClaims,
): { firstName: string; lastName: string } => {
  const given = claims.given_name?.trim();
  const family = claims.family_name?.trim();
  if (given || family) {
    return {
      firstName: given || 'User',
      lastName: family || '-',
    };
  }
  const full = claims.name?.trim();
  if (full) {
    const parts: string[] = full.split(/\s+/);
    const firstName: string = parts[0] ?? 'User';
    const lastName: string = parts.slice(1).join(' ') || '-';
    return { firstName, lastName };
  }
  return { firstName: 'Auth0', lastName: 'User' };
};
