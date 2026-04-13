import * as jwt from 'jsonwebtoken';

import {
  AUTH0_JWT_SIGNING_ALGORITHM,
  AUTH0_JWKS_WELL_KNOWN_PATH,
} from '../constants/auth0-jwt.constant';
import {
  buildAuth0Issuer,
  buildAuth0JwksUri,
  collectAuth0Audiences,
  getAuth0JwtVerifyAlgorithms,
  mapJwtPayloadToAuth0VerifiedClaims,
  normalizeAuth0Domain,
  verifyJwtWithJwks,
} from './token-verifier.helper';

describe('token-verifier.helper', () => {
  describe('normalizeAuth0Domain', () => {
    it('strips https scheme and trailing slash', () => {
      const actual = normalizeAuth0Domain('https://tenant.auth0.com/');
      expect(actual).toBe('tenant.auth0.com');
    });

    it('strips http scheme', () => {
      const actual = normalizeAuth0Domain('http://tenant.auth0.com');
      expect(actual).toBe('tenant.auth0.com');
    });
  });

  describe('buildAuth0Issuer', () => {
    it('builds issuer with trailing slash', () => {
      const actual = buildAuth0Issuer('tenant.auth0.com');
      expect(actual).toBe('https://tenant.auth0.com/');
    });
  });

  describe('buildAuth0JwksUri', () => {
    it('uses the well-known JWKS path constant', () => {
      const actual = buildAuth0JwksUri('tenant.auth0.com');
      expect(actual).toBe(
        `https://tenant.auth0.com${AUTH0_JWKS_WELL_KNOWN_PATH}`,
      );
      expect(AUTH0_JWKS_WELL_KNOWN_PATH).toBe('/.well-known/jwks.json');
    });
  });

  describe('collectAuth0Audiences', () => {
    it('drops empty values', () => {
      const actual = collectAuth0Audiences('api-aud', undefined);
      expect(actual).toEqual(['api-aud']);
    });

    it('returns both when present', () => {
      const actual = collectAuth0Audiences('api', 'client');
      expect(actual).toEqual(['api', 'client']);
    });
  });

  describe('getAuth0JwtVerifyAlgorithms', () => {
    it('returns RS256', () => {
      expect(getAuth0JwtVerifyAlgorithms()).toEqual([
        AUTH0_JWT_SIGNING_ALGORITHM,
      ]);
    });
  });

  describe('mapJwtPayloadToAuth0VerifiedClaims', () => {
    it('returns null when sub is missing', () => {
      const actual = mapJwtPayloadToAuth0VerifiedClaims({} as jwt.JwtPayload);
      expect(actual).toBeNull();
    });

    it('maps string claims', () => {
      const actual = mapJwtPayloadToAuth0VerifiedClaims({
        sub: 'auth0|1',
        email: 'a@b.com',
        name: 'N',
        given_name: 'G',
        family_name: 'F',
      } as jwt.JwtPayload);
      expect(actual).toEqual({
        sub: 'auth0|1',
        email: 'a@b.com',
        name: 'N',
        given_name: 'G',
        family_name: 'F',
      });
    });
  });

  describe('verifyJwtWithJwks', () => {
    it('rejects when getKey returns an error', async () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-kid' }),
      ).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-1' })).toString(
        'base64url',
      );
      const token = `${header}.${payload}.ignored`;
      const getKey: jwt.GetPublicKeyOrSecret = (_h, cb) =>
        cb(new Error('no signing key'));
      await expect(
        verifyJwtWithJwks(token, getKey, { algorithms: ['RS256'] }),
      ).rejects.toThrow('no signing key');
    });
  });
});
