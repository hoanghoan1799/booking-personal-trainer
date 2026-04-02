import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Exceptions
import { RateLimitExceededException } from '../exceptions/rate-limit-exceeded.exception';

// Helpers
import { getRateLimitTracker } from '../helpers/rate-limit.helper';

/**
 * Global rate-limiting guard.
 *
 * Keying strategy:
 * - Authenticated users are tracked by **user id**.
 * - If a token exists but user is not resolved, track by **token hash**.
 * - Otherwise track by **IP address**.
 *
 * Error handling:
 * - Throws `RateLimitExceededException` so the API returns a consistent 429 payload.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(getRateLimitTracker(req as Request).tracker);
  }

  protected throwThrottlingException(
    _context: ExecutionContext,
    throttlerLimitDetail: {
      limit: number;
      ttl: number;
      timeToExpire: number;
      isBlocked: boolean;
      timeToBlockExpire: number;
    },
  ): Promise<void> {
    const retryAfterSeconds = throttlerLimitDetail.isBlocked
      ? throttlerLimitDetail.timeToBlockExpire
      : throttlerLimitDetail.timeToExpire;
    return Promise.reject(
      new RateLimitExceededException({
        limit: throttlerLimitDetail.limit,
        ttlMilliseconds: throttlerLimitDetail.ttl,
        retryAfterSeconds,
        isBlocked: throttlerLimitDetail.isBlocked,
      }),
    );
  }
}
