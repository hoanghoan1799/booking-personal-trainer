import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

// Commons
import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';
import { ERROR_MESSAGES } from '../../../../common/constants/message.constant';

// Entities
import { Workout } from '../../../workout/entities/workout.entity';

// Services
import { PaymentsService } from '../payments.service';
import { BillingService } from '../../../billing/services/billing.service';

// Shared
import { StripeService } from '../../../../shared/stripe/stripe.service';

// Repositories
import { PaymentRepositoryToken } from '../../repositories/payment.repository.interface';

type StripeClientMock = {
  readonly paymentIntents: {
    readonly create: jest.Mock;
    readonly retrieve: jest.Mock;
    readonly cancel: jest.Mock;
  };
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: {
    create: jest.Mock;
    findByProviderAndIdempotencyKey: jest.Mock;
    findByProviderPaymentIntentId: jest.Mock;
    save: jest.Mock;
  };
  let stripeClient: StripeClientMock;
  let stripeService: {
    getClient: jest.Mock;
    createIdempotencyKey: jest.Mock;
  };
  let billingService: {
    getLatestActiveWorkoutCharge: jest.Mock;
  };
  let em: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    paymentRepo = {
      create: jest.fn(),
      findByProviderAndIdempotencyKey: jest.fn(),
      findByProviderPaymentIntentId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    stripeClient = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        cancel: jest.fn().mockResolvedValue({}),
      },
    };
    stripeService = {
      getClient: jest.fn().mockReturnValue(stripeClient),
      createIdempotencyKey: jest.fn().mockReturnValue('idem-key'),
    };
    billingService = {
      getLatestActiveWorkoutCharge: jest.fn(),
    };
    em = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentRepositoryToken, useValue: paymentRepo },
        { provide: StripeService, useValue: stripeService },
        { provide: BillingService, useValue: billingService },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createWorkoutPaymentIntent', () => {
    it('should throw NotFoundException when workout not found', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.createWorkoutPaymentIntent({
          workoutId: 'w1',
          traineeId: 't1',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when trainee does not own workout', async () => {
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 'other' },
        trainer: { id: 'trainer-1' },
      } as unknown as Workout);

      await expect(
        service.createWorkoutPaymentIntent({
          workoutId: 'w1',
          traineeId: 't1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when no active billing charge exists', async () => {
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 't1' },
        trainer: { id: 'trainer-1' },
      } as unknown as Workout);
      billingService.getLatestActiveWorkoutCharge.mockResolvedValue(null);

      await expect(
        service.createWorkoutPaymentIntent({
          workoutId: 'w1',
          traineeId: 't1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reuse existing payment by idempotency key and return client secret', async () => {
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 't1' },
        trainer: { id: 'trainer-1' },
      } as unknown as Workout);
      billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
        id: 'c1',
        amountCents: 1000,
        currency: 'USD',
      });
      paymentRepo.findByProviderAndIdempotencyKey.mockResolvedValue({
        id: 'p1',
        amountCents: 1000,
        currency: 'USD',
        providerPaymentIntentId: 'pi_1',
      });
      stripeClient.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        client_secret: 'secret',
      });

      const actual = await service.createWorkoutPaymentIntent({
        workoutId: 'w1',
        traineeId: 't1',
      });

      expect(actual).toEqual(
        expect.objectContaining({
          paymentId: 'p1',
          providerPaymentIntentId: 'pi_1',
          clientSecret: 'secret',
          amountCents: 1000,
          currency: 'USD',
        }),
      );
    });

    it('should throw when Stripe retrieve returns missing client_secret', async () => {
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 't1' },
        trainer: { id: 'trainer-1' },
      } as unknown as Workout);
      billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
        id: 'c1',
        amountCents: 1000,
        currency: 'USD',
      });
      paymentRepo.findByProviderAndIdempotencyKey.mockResolvedValue({
        id: 'p1',
        amountCents: 1000,
        currency: 'USD',
        providerPaymentIntentId: 'pi_1',
      });
      stripeClient.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        client_secret: null,
      });

      await expect(
        service.createWorkoutPaymentIntent({
          workoutId: 'w1',
          traineeId: 't1',
        }),
      ).rejects.toThrow(ERROR_MESSAGES.STRIPE.MISSING_STRIPE_CONFIG);
    });

    it('should map non-terminal Stripe status and persist payment', async () => {
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 't1' },
        trainer: { id: 'trainer-1', stripeAccountId: null },
      } as unknown as Workout);
      billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
        id: 'c1',
        amountCents: 1000,
        currency: 'USD',
      });
      paymentRepo.findByProviderAndIdempotencyKey.mockResolvedValue(null);
      paymentRepo.create.mockResolvedValue({
        id: 'p1',
        amountCents: 1000,
        currency: 'USD',
        status: PaymentStatus.PROCESSING,
        providerPaymentIntentId: null,
        metadata: {},
      });
      stripeClient.paymentIntents.create.mockResolvedValue({
        id: 'pi_1',
        status: 'processing',
        client_secret: 'secret',
      });
      paymentRepo.findByProviderPaymentIntentId.mockResolvedValue(null);

      const actual = await service.createWorkoutPaymentIntent({
        workoutId: 'w1',
        traineeId: 't1',
      });

      expect(actual.clientSecret).toBe('secret');
      expect(paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'p1',
          providerPaymentIntentId: 'pi_1',
          status: PaymentStatus.PROCESSING,
        }),
      );
    });

    it('should mark existing payment as paid and throw when latest intent succeeded', async () => {
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 't1' },
        trainer: { id: 'trainer-1', stripeAccountId: null },
      } as unknown as Workout);
      billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
        id: 'c1',
        amountCents: 1000,
        currency: 'USD',
      });
      paymentRepo.findByProviderAndIdempotencyKey.mockResolvedValue(null);
      paymentRepo.create.mockResolvedValue({
        id: 'p_pre',
        amountCents: 1000,
        currency: 'USD',
        status: PaymentStatus.PROCESSING,
        providerPaymentIntentId: null,
        metadata: {},
      });
      stripeClient.paymentIntents.create.mockResolvedValue({
        id: 'pi_1',
        status: 'processing',
        client_secret: 'secret',
      });
      const existingPayment = {
        id: 'p_exist',
        amountCents: 1000,
        currency: 'USD',
        status: PaymentStatus.PROCESSING,
        providerPaymentIntentId: 'pi_1',
        paidAt: null,
        failureReason: null,
        metadata: {},
      };
      paymentRepo.findByProviderPaymentIntentId.mockResolvedValue(
        existingPayment,
      );
      stripeClient.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        status: 'succeeded',
        client_secret: 'secret',
      });

      await expect(
        service.createWorkoutPaymentIntent({
          workoutId: 'w1',
          traineeId: 't1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p_exist', status: PaymentStatus.PAID }),
      );
    });

    it('should create retry intent when latest intent is canceled', async () => {
      stripeService.createIdempotencyKey
        .mockReturnValueOnce('idem-key')
        .mockReturnValueOnce('retry-key');
      em.findOne.mockResolvedValue({
        id: 'w1',
        trainee: { id: 't1' },
        trainer: { id: 'trainer-1', stripeAccountId: null },
      } as unknown as Workout);
      billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
        id: 'c1',
        amountCents: 1000,
        currency: 'USD',
      });
      paymentRepo.findByProviderAndIdempotencyKey.mockResolvedValue(null);
      paymentRepo.create
        .mockResolvedValueOnce({
          id: 'p_pre',
          amountCents: 1000,
          currency: 'USD',
          status: PaymentStatus.PROCESSING,
          providerPaymentIntentId: null,
          metadata: {},
        })
        .mockResolvedValueOnce({
          id: 'p_retry',
          amountCents: 1000,
          currency: 'USD',
          status: PaymentStatus.PROCESSING,
          providerPaymentIntentId: 'pi_retry',
          metadata: {},
        });
      stripeClient.paymentIntents.create
        .mockResolvedValueOnce({
          id: 'pi_1',
          status: 'processing',
          client_secret: 'secret',
        })
        .mockResolvedValueOnce({
          id: 'pi_retry',
          status: 'requires_action',
          client_secret: 'secret_retry',
        });
      const existingPayment = {
        id: 'p_exist',
        amountCents: 1000,
        currency: 'USD',
        status: PaymentStatus.CANCELLED,
        providerPaymentIntentId: 'pi_1',
        metadata: {},
      };
      paymentRepo.findByProviderPaymentIntentId.mockResolvedValue(
        existingPayment,
      );
      stripeClient.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        status: 'canceled',
        client_secret: 'secret',
      });

      const actual = await service.createWorkoutPaymentIntent({
        workoutId: 'w1',
        traineeId: 't1',
      });

      expect(actual.providerPaymentIntentId).toBe('pi_retry');
      expect(actual.clientSecret).toBe('secret_retry');
    });
  });

  describe('cancelPaymentIntent', () => {
    it('should call Stripe cancel', async () => {
      await service.cancelPaymentIntent({ providerPaymentIntentId: 'pi_1' });

      expect(stripeClient.paymentIntents.cancel).toHaveBeenCalledWith('pi_1');
    });
  });

  describe('mapStripePaymentIntentToPaymentStatus', () => {
    it('should map known statuses and default to PROCESSING', () => {
      expect(
        service.mapStripePaymentIntentToPaymentStatus(
          'requires_payment_method',
        ),
      ).toBe(PaymentStatus.REQUIRES_PAYMENT_METHOD);
      expect(service.mapStripePaymentIntentToPaymentStatus('succeeded')).toBe(
        PaymentStatus.PAID,
      );
      expect(service.mapStripePaymentIntentToPaymentStatus('unknown')).toBe(
        PaymentStatus.PROCESSING,
      );
    });
  });

  describe('computePlatformFeeSplit', () => {
    it('should clamp fee bps env and compute split', () => {
      process.env.PLATFORM_WORKOUT_FEE_BPS = '1500';

      const actual = (
        service as unknown as {
          computePlatformFeeSplit(input: { readonly grossCents: number }): {
            readonly platformFeeCents: number;
            readonly trainerShareCents: number;
          };
        }
      ).computePlatformFeeSplit({ grossCents: 1000 });

      expect(actual.platformFeeCents).toBe(150);
      expect(actual.trainerShareCents).toBe(850);
    });
  });
});
