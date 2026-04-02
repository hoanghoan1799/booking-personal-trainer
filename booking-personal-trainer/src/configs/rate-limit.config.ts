import type { ExecutionContext } from '@nestjs/common';
import type {
  ThrottlerModuleOptions,
  ThrottlerOptions,
} from '@nestjs/throttler';
import type { Request } from 'express';

// Helpers
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
  type RateLimitGroup,
} from '../common/helpers/rate-limit-override.helper';

const getRequestFromContext = (context: ExecutionContext): Request =>
  context.switchToHttp().getRequest<Request>();

const createThrottler = (params: {
  readonly name: string;
  readonly ttlMilliseconds: number;
  readonly limits: RateLimitGroup;
}): ThrottlerOptions => ({
  name: params.name,
  ttl: params.ttlMilliseconds,
  limit: createRateLimitByIdentityResolver(params.limits),
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
      ttlMilliseconds: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limits: { ip: 20, token: 40, user: 60 },
    }),
    createThrottler({
      name: 'minute',
      ttlMilliseconds: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limits: { ip: 120, token: 240, user: 300 },
    }),
    createThrottler({
      name: 'hour',
      ttlMilliseconds: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limits: { ip: 2000, token: 4000, user: 6000 },
    }),
  ],
  setHeaders: true,
};
