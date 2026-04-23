import { splitNameFromAuth0Claims } from '../split-name-from-auth0-claims.helper';
import type { Auth0VerifiedClaims } from '../../types/auth0-verified-claims.type';

describe('splitNameFromAuth0Claims', () => {
  it('should prefer given_name and family_name', () => {
    const actual = splitNameFromAuth0Claims({
      sub: 'auth0|user',
      given_name: 'Jane',
      family_name: 'Doe',
    } satisfies Auth0VerifiedClaims);
    expect(actual).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('should default missing family_name to "-"', () => {
    const actual = splitNameFromAuth0Claims({
      sub: 'auth0|user',
      given_name: 'Jane',
    } satisfies Auth0VerifiedClaims);
    expect(actual).toEqual({ firstName: 'Jane', lastName: '-' });
  });

  it('should fall back to name split', () => {
    const actual = splitNameFromAuth0Claims({
      sub: 'auth0|user',
      name: 'Jane Mary Doe',
    } satisfies Auth0VerifiedClaims);
    expect(actual).toEqual({ firstName: 'Jane', lastName: 'Mary Doe' });
  });

  it('should fall back to Auth0 User when no names present', () => {
    const actual = splitNameFromAuth0Claims({ sub: 'auth0|user' });
    expect(actual).toEqual({ firstName: 'Auth0', lastName: 'User' });
  });
});
