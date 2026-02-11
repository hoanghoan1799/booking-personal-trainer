import { HttpException, HttpStatus } from '@nestjs/common';

// Constants
import { RATE_LIMIT } from '../constants/rate-limit.constant';

type RateLimitExceededExceptionParams = Readonly<{
  limit: number;
  ttlMilliseconds: number;
  retryAfterSeconds: number;
  isBlocked: boolean;
}>;

/**
 * Exception thrown when a request exceeds the configured rate limits.
 *
 * Purpose:
 * - Provide a consistent, clear, machine-readable error response for 429 (Too Many Requests).
 * - Include retry information so clients can back off and retry responsibly.
 */
export class RateLimitExceededException extends HttpException {
  public constructor(params: RateLimitExceededExceptionParams) {
    const ttlSeconds = Math.max(1, Math.ceil(params.ttlMilliseconds / 1000));
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: RATE_LIMIT.ERROR.NAME,
        message: RATE_LIMIT.ERROR.MESSAGE,
        code: RATE_LIMIT.ERROR.CODE,
        details: {
          limit: params.limit,
          windowSeconds: ttlSeconds,
          retryAfterSeconds: Math.max(1, params.retryAfterSeconds),
          isBlocked: params.isBlocked,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
