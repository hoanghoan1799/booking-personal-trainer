import type { ApiPropertyOptions } from '@nestjs/swagger';

import { ReportBucket } from '../enums/report-bucket.enum';

export const ReportingDtoSwagger = {
  RevenueReportQuery: {
    ApiPropertyOptional: {
      From: {
        description:
          'Filter payments by paidAt/refundedAt from this time (inclusive).',
        example: '2026-01-01T00:00:00.000Z',
      },
      To: {
        description:
          'Filter payments by paidAt/refundedAt up to this time (exclusive).',
        example: '2026-04-01T00:00:00.000Z',
      },
      Currency: {
        description: 'Optional currency filter (e.g. USD).',
        example: 'USD',
      },
      Bucket: {
        enum: ReportBucket,
        description: 'Calendar bucket size (UTC).',
        default: ReportBucket.MONTH,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  RevenueBucketRow: {
    ApiProperty: {
      BucketStart: { example: '2026-01-01T00:00:00.000Z' },
      BucketEnd: {
        description:
          'Exclusive end of the bucket (first instant after the period).',
        example: '2026-02-01T00:00:00.000Z',
      },
      GmvNetCents: { description: 'Net gross (paid minus refunded) in cents.' },
      IsEstimated: {
        description:
          'True when any split in this bucket was estimated from bps.',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerKpiQuery: {
    ApiPropertyOptional: {
      From: {
        description:
          'Filter bookings/workouts by startTime from this time (inclusive).',
      },
      To: {
        description:
          'Filter bookings/workouts by startTime up to this time (exclusive).',
      },
      Limit: {
        description: 'Max leaderboard rows (admin).',
        default: 50,
        minimum: 1,
        maximum: 200,
      },
      Currency: {
        description:
          'When set, trainer share revenue sums only payments in this currency.',
        example: 'USD',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerKpiRow: {
    ApiProperty: {
      DeliveredMinutes: {
        description:
          'Sum of workout durations for DONE workouts (whole minutes, rounded down).',
      },
      TrainerShareNetCents: {
        description:
          'Trainer share net cents for the optional currency filter (default USD).',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  LoyalUsersQuery: {
    ApiPropertyOptional: {
      From: {
        description: 'Filter bookings by createdAt from this time (inclusive).',
      },
      To: {
        description:
          'Filter bookings by createdAt up to this time (exclusive).',
      },
      Limit: {
        description: 'Max rows to return.',
        default: 50,
        minimum: 1,
        maximum: 200,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  LoyalUserRow: {
    ApiProperty: {
      BookingsCount: { description: 'Bookings in scope (by createdAt).' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
