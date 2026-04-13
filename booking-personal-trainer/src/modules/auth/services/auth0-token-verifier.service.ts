import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

// Commons
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

export type Auth0VerifiedClaims = {
  readonly sub: string;
  readonly email?: string;
  readonly name?: string;
  readonly given_name?: string;
  readonly family_name?: string;
};

@Injectable()
export class Auth0TokenVerifierService {
  private jwksClient: ReturnType<typeof jwksRsa> | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verifies the JWT with Auth0 JWKS and returns normalized claims.
   * Tries AUTH0_AUDIENCE then AUTH0_CLIENT_ID as JWT audience (access vs ID token).
   */
  // TODO: Refactor
  async verifyAndDecode(token: string): Promise<Auth0VerifiedClaims> {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_AUTH0_TOKEN);
    }
    const rawDomain = this.configService.getOrThrow<string>('AUTH0_DOMAIN');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const issuer = `https://${domain}/`;
    const audienceApi = this.configService
      .get<string>('AUTH0_AUDIENCE')
      ?.trim();
    const audienceClient = this.configService
      .get<string>('AUTH0_CLIENT_ID')
      ?.trim();
    const audiences = [audienceApi, audienceClient].filter((a): a is string =>
      Boolean(a),
    );
    if (audiences.length === 0) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.AUTH0_AUDIENCE_NOT_CONFIGURED,
      );
    }
    const client = this.getJwksClient(domain);
    const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
      if (!header.kid) {
        callback(new Error('Token header missing kid'));
        return;
      }
      client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, key?.getPublicKey());
      });
    };
    let lastError: Error | null = null;
    for (const audience of audiences) {
      try {
        const payload = await new Promise<jwt.JwtPayload>((resolve, reject) => {
          jwt.verify(
            trimmed,
            getKey,
            { issuer, audience, algorithms: ['RS256'] },
            (err, decoded) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(decoded as jwt.JwtPayload);
            },
          );
        });
        return this.normalizeClaims(payload);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }
    throw new UnauthorizedException(
      lastError?.message ?? ERROR_MESSAGES.AUTH.INVALID_AUTH0_TOKEN,
    );
  }

  private getJwksClient(domain: string): ReturnType<typeof jwksRsa> {
    if (!this.jwksClient) {
      this.jwksClient = jwksRsa({
        jwksUri: `https://${domain}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
      });
    }
    return this.jwksClient;
  }

  private normalizeClaims(payload: jwt.JwtPayload): Auth0VerifiedClaims {
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_AUTH0_TOKEN);
    }
    return {
      sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      given_name:
        typeof payload.given_name === 'string' ? payload.given_name : undefined,
      family_name:
        typeof payload.family_name === 'string'
          ? payload.family_name
          : undefined,
    };
  }
}
