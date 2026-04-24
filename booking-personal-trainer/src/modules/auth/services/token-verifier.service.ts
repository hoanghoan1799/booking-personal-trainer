import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Commons
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

// Helpers
import {
  buildAuth0Issuer,
  buildAuth0JwksUri,
  collectAuth0Audiences,
  createJwtGetKeyFromJwksClient,
  getAuth0JwtVerifyAlgorithms,
  mapJwtPayloadToAuth0VerifiedClaims,
  normalizeAuth0Domain,
  verifyJwtWithJwks,
} from '../helpers/token-verifier.helper';
import type { Auth0VerifiedClaims } from '../types/auth0-verified-claims.type';
import type { JwksRsaClient } from '../helpers/token-verifier.helper';

/**
 * Verifies Auth0-issued JWTs (RS256) via JWKS and returns normalized profile claims.
 */
@Injectable()
export class TokenVerifierService {
  private jwksClient: JwksRsaClient | null = null;
  private cachedJwksUri: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async verifyAndDecode(token: string): Promise<Auth0VerifiedClaims> {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }
    const rawDomain = this.configService.getOrThrow<string>('AUTH0_DOMAIN');
    const domain = normalizeAuth0Domain(rawDomain);
    const issuer = buildAuth0Issuer(domain);
    const audienceApi = this.configService
      .get<string>('AUTH0_AUDIENCE')
      ?.trim();
    const audienceClient = this.configService
      .get<string>('AUTH0_CLIENT_ID')
      ?.trim();
    const audiences = collectAuth0Audiences(audienceApi, audienceClient);
    if (audiences.length === 0) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.THIRD_PARTY_NOT_CONFIGURED,
      );
    }
    const jwksUri = this.resolveJwksUri(domain);
    const client = this.getJwksClient(jwksUri);
    const getKey = createJwtGetKeyFromJwksClient(client);
    const algorithms = getAuth0JwtVerifyAlgorithms();
    let lastError: Error | null = null;
    for (const audience of audiences) {
      try {
        const payload = await verifyJwtWithJwks(trimmed, getKey, {
          issuer,
          audience,
          algorithms,
        });
        const claims = mapJwtPayloadToAuth0VerifiedClaims(payload);
        if (!claims) {
          throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
        }
        return claims;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }
    throw new UnauthorizedException(
      lastError?.message ?? ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    );
  }

  private resolveJwksUri(domain: string): string {
    const configured = this.configService.get<string>('AUTH0_JWKS_URI')?.trim();
    if (configured) {
      return configured;
    }
    return buildAuth0JwksUri(domain);
  }

  private getJwksClient(jwksUri: string): JwksRsaClient {
    if (!this.jwksClient || this.cachedJwksUri !== jwksUri) {
      this.cachedJwksUri = jwksUri;
      // Lazy load: prevents Jest E2E from parsing ESM-only transitive deps.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod: unknown = require('jwks-rsa');
      const jwksRsaFactory: (args: {
        jwksUri: string;
        cache: boolean;
        rateLimit: boolean;
      }) => JwksRsaClient = ((mod as { default?: unknown }).default ??
        mod) as (args: {
        jwksUri: string;
        cache: boolean;
        rateLimit: boolean;
      }) => JwksRsaClient;
      this.jwksClient = jwksRsaFactory({
        jwksUri,
        cache: true,
        rateLimit: true,
      });
    }
    return this.jwksClient;
  }
}

export { TokenVerifierService as Auth0TokenVerifierService };
