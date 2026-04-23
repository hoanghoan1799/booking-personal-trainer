import { createHash } from 'crypto';
import type { Request } from 'express';

// Constants
import { RATE_LIMIT } from '../constants/rate-limit.constant';
import {
  AUTHORIZATION_HEADER,
  TOKEN_HASH_ALGORITHM,
  TOKEN_HASH_ENCODING,
  BEARER_TOKEN_REGEX,
} from '../constants/token.constants';

type RateLimitTrackerKind =
  (typeof RATE_LIMIT.TRACKER_KIND)[keyof typeof RATE_LIMIT.TRACKER_KIND];

type RateLimitTrackerResult = Readonly<{
  tracker: string;
  kind: RateLimitTrackerKind;
}>;

const extractBearerToken = (
  authorizationHeaderValue: unknown,
): string | null => {
  if (typeof authorizationHeaderValue !== 'string') return null;
  const match = authorizationHeaderValue.match(BEARER_TOKEN_REGEX);
  if (!match) return null;
  const token = match[1]?.trim();
  if (!token) return null;
  return token;
};

const hashToken = (token: string): string =>
  createHash(TOKEN_HASH_ALGORITHM).update(token).digest(TOKEN_HASH_ENCODING);

/**
 * Builds a rate-limit tracker key using the best available identifier.
 *
 * Priority:
 * - **User id** (authenticated requests): stable across devices and IP changes.
 * - **Token hash** (token is present but user object is not): avoids storing raw tokens in keys/logs.
 * - **IP address** (unauthenticated / anonymous traffic): baseline DDoS / abuse protection.
 */
export const getRateLimitTracker = (req: Request): RateLimitTrackerResult => {
  const requestWithUser = req as unknown as { user?: { id?: unknown } };
  const userId = requestWithUser.user?.id;
  if (typeof userId === 'string' && userId.length > 0) {
    return { tracker: `user:${userId}`, kind: RATE_LIMIT.TRACKER_KIND.USER };
  }
  const tokenFromHeader = extractBearerToken(
    req.headers?.[AUTHORIZATION_HEADER],
  );
  if (tokenFromHeader) {
    return {
      tracker: `token:${hashToken(tokenFromHeader)}`,
      kind: RATE_LIMIT.TRACKER_KIND.TOKEN,
    };
  }
  const ipAddress =
    typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : 'unknown-ip';
  return { tracker: `ip:${ipAddress}`, kind: RATE_LIMIT.TRACKER_KIND.IP };
};
