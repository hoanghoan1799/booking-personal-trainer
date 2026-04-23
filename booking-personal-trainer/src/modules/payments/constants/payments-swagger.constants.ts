import { HttpStatus } from '@nestjs/common';
import type { ApiResponseOptions } from '@nestjs/swagger';

import { AdminEarningsQueryDto } from '../dtos/admin-earnings-query.dto';
import { AdminEarningsResponseDto } from '../dtos/admin-earnings-response.dto';

import { StripeConnectOnboardingLinkResponseDto } from '../dtos/stripe-connect-onboarding-link-response.dto';
import { TrainerPayoutsQueryDto } from '../dtos/trainer-payouts-query.dto';
import { TrainerPayoutsResponseDto } from '../dtos/trainer-payouts-response.dto';

import { WorkoutPaymentAccessResponseDto } from '../dtos/workout-payment-access-response.dto';
import { CreateWorkoutPaymentIntentResponseDto } from '../dtos/create-workout-payment-intent-response.dto';

import { PaymentsDtoSwagger } from './payments-swagger-dto.constants';

export const PaymentsSwagger = {
  Controller: {
    AdminEarnings: {
      ApiOperation: {
        GetEarnings: {
          summary: 'Admin earnings dashboard',
          description:
            'Aggregated totals and payers/payees derived from Payments (paid/refunded) grouped by currency.',
        },
      },
      ApiResponse: {
        GetEarningsOk: {
          status: HttpStatus.OK,
          description: 'Earnings snapshot',
          type: AdminEarningsResponseDto,
        },
      } satisfies Record<string, ApiResponseOptions>,
    },
    TrainerStripeConnect: {
      ApiOperation: {
        Onboard: {
          summary: 'Start Stripe Connect onboarding (trainer)',
          description:
            'Creates (or reuses) the trainer Stripe account and returns an onboarding link URL.',
        },
      },
      ApiResponse: {
        OnboardCreated: {
          status: HttpStatus.CREATED,
          description: 'Onboarding link created',
          type: StripeConnectOnboardingLinkResponseDto,
        },
      } satisfies Record<string, ApiResponseOptions>,
    },
    TrainerPayouts: {
      ApiOperation: {
        GetMyPayouts: {
          summary: 'Trainer payouts summary',
          description:
            'Shows trainer share amounts grouped by currency and payout status (pending/transferred/failed) derived from payment metadata.',
        },
      },
      ApiResponse: {
        GetMyPayoutsOk: {
          status: HttpStatus.OK,
          description: 'Payouts snapshot',
          type: TrainerPayoutsResponseDto,
        },
      } satisfies Record<string, ApiResponseOptions>,
    },
    StripeWebhook: {
      ApiOperation: {
        Webhook: {
          summary: 'Stripe webhook endpoint',
          description: 'Receives Stripe events and synchronizes payment state.',
        },
      },
      ApiResponse: {
        WebhookOk: {
          status: HttpStatus.OK,
          description: 'Webhook received',
        },
      } satisfies Record<string, ApiResponseOptions>,
    },
    WorkoutPayments: {
      ApiOperation: {
        GetAccess: {
          summary: 'Get workout payment access + quoted price',
          description:
            'Returns whether the workout is paid/unlocked for the current user, and the quoted price from billing_charges.',
        },
        CreateIntent: {
          summary: 'Create a Stripe PaymentIntent for a workout',
          description:
            'Creates a PaymentIntent for the latest ACTIVE billing charge of the workout and returns its client_secret.',
        },
      },
      ApiResponse: {
        GetAccessOk: {
          status: HttpStatus.OK,
          description: 'Access snapshot',
          type: WorkoutPaymentAccessResponseDto,
        },
        CreateIntentCreated: {
          status: HttpStatus.CREATED,
          description: 'Payment intent created',
          type: CreateWorkoutPaymentIntentResponseDto,
        },
      } satisfies Record<string, ApiResponseOptions>,
    },
  },
  Dto: {
    ...PaymentsDtoSwagger,
    AdminEarningsQuery: {
      ...PaymentsDtoSwagger.AdminEarningsQuery,
      ApiExtraModels: { Query: AdminEarningsQueryDto },
    },
    TrainerPayoutsQuery: {
      ...PaymentsDtoSwagger.TrainerPayoutsQuery,
      ApiExtraModels: { Query: TrainerPayoutsQueryDto },
    },
  },
} as const;
