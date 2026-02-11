import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Constants
import { RATE_LIMIT } from '../constants/rate-limit.constant';

// Helpers
import { getRateLimitTracker } from './rate-limit.helper';

export type RateLimitGroup = Readonly<{
  ip: number;
  token: number;
  user: number;
}>;

export const RATE_LIMIT_WINDOW_TTL_MILLISECONDS = {
  BURST: 10_000,
  MINUTE: 60_000,
  HOUR: 3_600_000,
} as const;

const getRequestFromContext = (context: ExecutionContext): Request =>
  context.switchToHttp().getRequest<Request>();

/**
 * Creates a `limit` resolver for `@Throttle()` that keeps the "per ip / per token / per user" behavior.
 *
 * Why:
 * - Nest throttler supports dynamic limits via a function (Resolvable<number>).
 * - This keeps your rate limits fair for authenticated users while still protecting anonymous traffic.
 */
export const createRateLimitByIdentityResolver =
  (limits: RateLimitGroup) =>
  (context: ExecutionContext): number => {
    const request = getRequestFromContext(context);
    const { kind } = getRateLimitTracker(request);
    if (kind === RATE_LIMIT.TRACKER_KIND.USER) return limits.user;
    if (kind === RATE_LIMIT.TRACKER_KIND.TOKEN) return limits.token;
    return limits.ip;
  };
