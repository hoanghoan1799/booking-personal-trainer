import type { ApiPropertyOptions } from '@nestjs/swagger';

type SwaggerDtoClass = new (...args: unknown[]) => unknown;

export const PaymentsDtoSwagger = {
  AdminEarningsQuery: {
    ApiPropertyOptional: {
      From: {
        description:
          'Filter payments paid/refunded from this time (inclusive).',
        example: '2026-01-01T00:00:00.000Z',
      },
      To: {
        description:
          'Filter payments paid/refunded up to this time (exclusive).',
        example: '2026-02-01T00:00:00.000Z',
      },
      Currency: {
        description:
          'Optional currency filter (e.g. USD). When omitted, returns groups per currency.',
        example: 'USD',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  AdminEarningsTotals: {
    ApiProperty: {
      IsEstimated: {
        description:
          'True when any platformFee/trainerShare values were estimated (missing metadata).',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  AdminEarningsTrainerPayoutBreakdown: {
    ApiProperty: {
      StatusCounts: {
        description:
          'Counts by payout status (TRANSFERRED/AWAITING_TRAINER_CONNECT/FAILED/...).',
        example: { TRANSFERRED: 10, AWAITING_TRAINER_CONNECT: 2 },
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  AdminEarningsTrainerRow: {
    ApiProperty: {
      Payout: <T extends SwaggerDtoClass>(
        payoutDto: T,
      ): ApiPropertyOptions => ({
        type: payoutDto,
      }),
    },
  },
  AdminEarningsResponse: {
    ApiProperty: {
      Totals: <T extends SwaggerDtoClass>(
        totalsDto: T,
      ): ApiPropertyOptions => ({
        type: [totalsDto],
      }),
      Trainees: <T extends SwaggerDtoClass>(
        traineeRowDto: T,
      ): ApiPropertyOptions => ({
        type: [traineeRowDto],
      }),
      Trainers: <T extends SwaggerDtoClass>(
        trainerRowDto: T,
      ): ApiPropertyOptions => ({
        type: [trainerRowDto],
      }),
    },
  },
  TrainerPayoutsQuery: {
    ApiPropertyOptional: {
      From: {
        description:
          'Filter payments paid/refunded from this time (inclusive).',
        example: '2026-01-01T00:00:00.000Z',
      },
      To: {
        description:
          'Filter payments paid/refunded up to this time (exclusive).',
        example: '2026-02-01T00:00:00.000Z',
      },
      Currency: {
        description:
          'Optional currency filter (e.g. USD). When omitted, returns groups per currency.',
        example: 'USD',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerPayoutsCurrencySummary: {
    ApiProperty: {
      PaidTrainerShareCents: {
        description: 'Total trainer share for PAID payments.',
      },
      RefundedTrainerShareCents: {
        description: 'Total trainer share for REFUNDED payments.',
      },
      NetTrainerShareCents: {
        description: 'Net trainer share (paid - refunded).',
      },
      PayoutStatusCounts: {
        description:
          'Counts by payout status (TRANSFERRED/AWAITING_TRAINER_CONNECT/FAILED/...).',
        example: { TRANSFERRED: 10, AWAITING_TRAINER_CONNECT: 2 },
      },
      IsEstimated: {
        description:
          'True when any trainerShare was estimated (missing metadata.trainerShareCents).',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerPayoutsTransferRow: {
    ApiProperty: {
      TransferId: { nullable: true },
      ErrorMessage: { nullable: true },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerPayoutsResponse: {
    ApiProperty: {
      Summary: <T extends SwaggerDtoClass>(
        summaryDto: T,
      ): ApiPropertyOptions => ({
        type: [summaryDto],
      }),
      Rows: <T extends SwaggerDtoClass>(rowDto: T): ApiPropertyOptions => ({
        type: [rowDto],
        description:
          'Latest payout rows for reference (transfer id or error), filtered by date/currency.',
      }),
    },
  },
  WorkoutPaymentAccessResponse: {
    ApiProperty: {
      IsPaid: { description: 'Whether the workout is fully unlocked (paid).' },
      View: {
        description: 'Trainee view mode derived from payment state.',
        enum: ['LIMITED', 'FULL'],
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      BillingChargeId: {
        description:
          'Active billing charge id (quote) for the workout, if any.',
        format: 'uuid',
        nullable: true,
      },
      AmountCents: {
        description: 'Quoted price in cents from billing_charges.',
        nullable: true,
      },
      Currency: {
        description: 'Currency for the quoted price (from billing_charges).',
        nullable: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
