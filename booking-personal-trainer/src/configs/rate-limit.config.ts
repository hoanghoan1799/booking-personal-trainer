import type { ExecutionContext } from '@nestjs/common';
import type {
  ThrottlerModuleOptions,
  ThrottlerOptions,
} from '@nestjs/throttler';
import type { Request } from 'express';

// Constants
import { RATE_LIMIT } from '../common/constants/rate-limit.constant';

// Helpers
import { getRateLimitTracker } from '../common/helpers/rate-limit.helper';

type RateLimitGroup = Readonly<{
  ip: number;
  token: number;
  user: number;
}>;

const SECOND_IN_MILLISECONDS = 1000 as const;
const MINUTE_IN_MILLISECONDS = 60 * SECOND_IN_MILLISECONDS;
const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS;

const getRequestFromContext = (context: ExecutionContext): Request =>
  context.switchToHttp().getRequest<Request>();

const resolveLimitByIdentity =
  (limits: RateLimitGroup) =>
  (context: ExecutionContext): number => {
    const request = getRequestFromContext(context);
    const { kind } = getRateLimitTracker(request);
    if (kind === RATE_LIMIT.TRACKER_KIND.USER) return limits.user;
    if (kind === RATE_LIMIT.TRACKER_KIND.TOKEN) return limits.token;
    return limits.ip;
  };

const createThrottler = (params: {
  readonly name: string;
  readonly ttlMilliseconds: number;
  readonly limits: RateLimitGroup;
}): ThrottlerOptions => ({
  name: params.name,
  ttl: params.ttlMilliseconds,
  limit: resolveLimitByIdentity(params.limits),
  blockDuration: params.ttlMilliseconds,
  setHeaders: true,
});

/**
 * Rate limiting configuration.
 *
 * Goals:
 * - Protect the API against abuse and basic DDoS patterns.
 * - Apply fair limits to real users (higher limits for authenticated traffic).
 * - Return clear 429 responses (handled by `RateLimitGuard`).
 *
 * Limits are applied using three windows:
 * - `burst`: short-term spike protection.
 * - `minute`: normal API usage shaping.
 * - `hour`: longer-term abuse prevention.
 *
 * Identity used for limits:
 * - user id (best), then token hash, then IP.
 */
export const RATE_LIMIT_OPTIONS: ThrottlerModuleOptions = {
  /**
   * Skip throttling for Swagger UI and its related endpoints, since the UI can generate
   * many rapid requests (assets, schema, "Try it out" calls) during development.
   */
  skipIf: (context: ExecutionContext): boolean => {
    const request = getRequestFromContext(context);
    const url = typeof request.url === 'string' ? request.url : '';
    return url.includes('/api-docs');
  },
  throttlers: [
    createThrottler({
      name: 'burst',
      ttlMilliseconds: 10 * SECOND_IN_MILLISECONDS,
      limits: { ip: 20, token: 40, user: 60 },
    }),
    createThrottler({
      name: 'minute',
      ttlMilliseconds: 1 * MINUTE_IN_MILLISECONDS,
      limits: { ip: 120, token: 240, user: 300 },
    }),
    createThrottler({
      name: 'hour',
      ttlMilliseconds: 1 * HOUR_IN_MILLISECONDS,
      limits: { ip: 2000, token: 4000, user: 6000 },
    }),
  ],
  setHeaders: true,
};
