jest.mock('jsonwebtoken', () => {
  class JsonWebTokenError extends Error {}
  class TokenExpiredError extends Error {
    readonly expiredAt: Date;
    readonly inner?: Error;
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.expiredAt = expiredAt;
    }
  }
  class NotBeforeError extends Error {
    readonly date: Date;
    constructor(message: string, date: Date) {
      super(message);
      this.date = date;
    }
  }
  return {
    verify: jest.fn(),
    JsonWebTokenError,
    TokenExpiredError,
    NotBeforeError,
  };
});

import * as jwt from 'jsonwebtoken';

import {
  AUTH0_JWT_SIGNING_ALGORITHM,
  AUTH0_JWKS_WELL_KNOWN_PATH,
} from '../../constants/auth0-jwt.constant';
import {
  buildAuth0Issuer,
  buildAuth0JwksUri,
  collectAuth0Audiences,
  createJwtGetKeyFromJwksClient,
  getAuth0JwtVerifyAlgorithms,
  mapJwtPayloadToAuth0VerifiedClaims,
  normalizeAuth0Domain,
  verifyJwtWithJwks,
} from '../token-verifier.helper';

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
        email_verified: true,
        name: 'N',
        given_name: 'G',
        family_name: 'F',
      } as jwt.JwtPayload);
      expect(actual).toEqual({
        sub: 'auth0|1',
        email: 'a@b.com',
        email_verified: true,
        name: 'N',
        given_name: 'G',
        family_name: 'F',
      });
    });
  });

  describe('createJwtGetKeyFromJwksClient', () => {
    it('calls callback with error when header missing kid', () => {
      const client = {
        getSigningKey: jest.fn(),
      } as unknown as { getSigningKey: jest.Mock };
      const getKey = createJwtGetKeyFromJwksClient(client as never);
      const callback = jest.fn();

      getKey({ alg: 'RS256', typ: 'JWT' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(client.getSigningKey).not.toHaveBeenCalled();
    });

    it('calls callback with key public key when kid present', () => {
      const getPublicKey = jest.fn().mockReturnValue('public-key');
      const client = {
        getSigningKey: jest.fn(
          (
            _kid: string,
            cb: (
              err: Error | null,
              key?: { getPublicKey: () => string },
            ) => void,
          ) => {
            cb(null, { getPublicKey });
          },
        ),
      } as unknown as { getSigningKey: jest.Mock };
      const getKey = createJwtGetKeyFromJwksClient(client as never);
      const callback = jest.fn();

      getKey({ kid: 'kid', alg: 'RS256', typ: 'JWT' }, callback);

      expect(client.getSigningKey).toHaveBeenCalledWith(
        'kid',
        expect.any(Function),
      );
      expect(callback).toHaveBeenCalledWith(null, 'public-key');
    });

    it('calls callback with client error when signing key lookup fails', () => {
      const client = {
        getSigningKey: jest.fn((_kid: string, cb: (err: Error) => void) => {
          cb(new Error('jwks error'));
        }),
      } as unknown as { getSigningKey: jest.Mock };
      const getKey = createJwtGetKeyFromJwksClient(client as never);
      const callback = jest.fn();

      getKey({ kid: 'kid', alg: 'RS256', typ: 'JWT' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('verifyJwtWithJwks', () => {
    it('rejects when getKey returns an error', async () => {
      (jwt.verify as unknown as jest.Mock).mockImplementationOnce(
        (
          _token: string,
          _getKey: jwt.GetPublicKeyOrSecret,
          _options: jwt.VerifyOptions,
          cb: jwt.VerifyCallback,
        ) => {
          cb(new jwt.JsonWebTokenError('no signing key'));
        },
      );
      const getKey: jwt.GetPublicKeyOrSecret = (_h, cb) => cb(null, 'public');
      await expect(
        verifyJwtWithJwks('token', getKey, { algorithms: ['RS256'] }),
      ).rejects.toThrow('no signing key');
    });

    it('resolves decoded payload when verify succeeds', async () => {
      (jwt.verify as unknown as jest.Mock).mockImplementationOnce(
        (
          _token: string,
          _getKey: jwt.GetPublicKeyOrSecret,
          _options: jwt.VerifyOptions,
          cb: jwt.VerifyCallback,
        ) => {
          cb(null, { sub: 'user-1' } as jwt.JwtPayload);
        },
      );
      const actual = await verifyJwtWithJwks(
        'token',
        (_h, cb) => cb(null, 'public'),
        { algorithms: ['RS256'] },
      );
      expect(actual.sub).toBe('user-1');
    });
  });
});
