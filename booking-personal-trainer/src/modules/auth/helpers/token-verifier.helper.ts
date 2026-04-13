import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

import {
  AUTH0_JWT_SIGNING_ALGORITHM,
  AUTH0_JWKS_WELL_KNOWN_PATH,
} from '../constants/auth0-jwt.constant';
import type { Auth0VerifiedClaims } from '../types/auth0-verified-claims.type';

export type JwksRsaClient = ReturnType<typeof jwksRsa>;

/**
 * Strips scheme and trailing slash from AUTH0_DOMAIN for host-only use.
 */
export const normalizeAuth0Domain = (rawDomain: string): string => {
  return rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

/**
 * Builds the issuer URL Auth0 puts in the `iss` claim.
 */
export const buildAuth0Issuer = (domain: string): string => {
  return `https://${domain}/`;
};

/**
 * Default JWKS URL for an Auth0 tenant. Override with AUTH0_JWKS_URI when non-standard.
 */
export const buildAuth0JwksUri = (domain: string): string => {
  return `https://${domain}${AUTH0_JWKS_WELL_KNOWN_PATH}`;
};

/**
 * Collects non-empty audience strings from config (API audience and/or SPA client id).
 */
export const collectAuth0Audiences = (
  audienceApi: string | undefined,
  audienceClient: string | undefined,
): string[] => {
  return [audienceApi, audienceClient].filter((a): a is string => Boolean(a));
};

/**
 * Wraps jwks-rsa signing key lookup in the callback shape `jsonwebtoken` expects.
 */
export const createJwtGetKeyFromJwksClient = (
  client: JwksRsaClient,
): jwt.GetPublicKeyOrSecret => {
  return (header, callback) => {
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
};

/**
 * Verifies a JWT asynchronously using RS256 and the given JWKS resolver.
 */
export const verifyJwtWithJwks = (
  token: string,
  getKey: jwt.GetPublicKeyOrSecret,
  options: jwt.VerifyOptions,
): Promise<jwt.JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(decoded as jwt.JwtPayload);
    });
  });
};

/**
 * Maps a verified JWT payload to our claims shape; returns null if `sub` is missing.
 */
export const mapJwtPayloadToAuth0VerifiedClaims = (
  payload: jwt.JwtPayload,
): Auth0VerifiedClaims | null => {
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  if (!sub) {
    return null;
  }
  return {
    sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    given_name:
      typeof payload.given_name === 'string' ? payload.given_name : undefined,
    family_name:
      typeof payload.family_name === 'string' ? payload.family_name : undefined,
  };
};

export const getAuth0JwtVerifyAlgorithms = (): jwt.Algorithm[] => {
  return [AUTH0_JWT_SIGNING_ALGORITHM];
};
