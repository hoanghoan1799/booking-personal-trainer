import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Auth0VerifiedClaims } from '../../types/auth0-verified-claims.type';
import { TokenVerifierService } from '../token-verifier.service';

jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

jest.mock('../../helpers/token-verifier.helper', () => ({
  normalizeAuth0Domain: jest.fn((d: string) => d),
  buildAuth0Issuer: jest.fn((d: string) => `https://${d}/`),
  buildAuth0JwksUri: jest.fn(
    (d: string) => `https://${d}/.well-known/jwks.json`,
  ),
  collectAuth0Audiences: jest.fn(() => ['aud-1', 'aud-2']),
  createJwtGetKeyFromJwksClient: jest.fn(() => 'getKey'),
  getAuth0JwtVerifyAlgorithms: jest.fn(() => ['RS256']),
  verifyJwtWithJwks: jest.fn(),
  mapJwtPayloadToAuth0VerifiedClaims: jest.fn(),
}));

import {
  collectAuth0Audiences,
  mapJwtPayloadToAuth0VerifiedClaims,
  verifyJwtWithJwks,
} from '../../helpers/token-verifier.helper';

describe('TokenVerifierService', () => {
  const createConfigServiceMock = (
    values: Record<string, string | undefined>,
  ): ConfigService =>
    ({
      getOrThrow: jest.fn((key: string) => {
        const value = values[key];
        if (value == null) {
          throw new Error(`Missing ${key}`);
        }
        return value;
      }),
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    (collectAuth0Audiences as unknown as jest.Mock).mockReturnValue([
      'aud-1',
      'aud-2',
    ]);
  });

  it('should throw UnauthorizedException for empty token', async () => {
    const configService = createConfigServiceMock({
      AUTH0_DOMAIN: 'example.auth0.com',
      AUTH0_AUDIENCE: 'aud',
    });
    const service = new TokenVerifierService(configService);

    await expect(service.verifyAndDecode('   ')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should throw when no audiences configured', async () => {
    (collectAuth0Audiences as unknown as jest.Mock).mockReturnValue([]);
    const configService = createConfigServiceMock({
      AUTH0_DOMAIN: 'example.auth0.com',
      AUTH0_AUDIENCE: '',
      AUTH0_CLIENT_ID: '',
    });
    const service = new TokenVerifierService(configService);

    await expect(service.verifyAndDecode('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should return claims when verification succeeds for some audience', async () => {
    (verifyJwtWithJwks as unknown as jest.Mock)
      .mockRejectedValueOnce(new Error('bad aud-1'))
      .mockResolvedValueOnce({ sub: 'x' });
    const expected: Auth0VerifiedClaims = {
      sub: 'sub',
      email: 'a@test.com',
      email_verified: true,
      given_name: 'A',
      family_name: 'B',
      name: 'A B',
    };
    (
      mapJwtPayloadToAuth0VerifiedClaims as unknown as jest.Mock
    ).mockReturnValue(expected);
    const configService = createConfigServiceMock({
      AUTH0_DOMAIN: 'example.auth0.com',
      AUTH0_AUDIENCE: 'aud',
      AUTH0_CLIENT_ID: 'client',
    });
    const service = new TokenVerifierService(configService);

    const actual = await service.verifyAndDecode('token');

    expect(actual).toBe(expected);
    expect(verifyJwtWithJwks).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when payload cannot map to claims', async () => {
    (verifyJwtWithJwks as unknown as jest.Mock).mockResolvedValue({ sub: 'x' });
    (
      mapJwtPayloadToAuth0VerifiedClaims as unknown as jest.Mock
    ).mockReturnValue(null);
    const configService = createConfigServiceMock({
      AUTH0_DOMAIN: 'example.auth0.com',
      AUTH0_AUDIENCE: 'aud',
    });
    const service = new TokenVerifierService(configService);

    await expect(service.verifyAndDecode('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
