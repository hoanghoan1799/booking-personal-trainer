import { Test, TestingModule } from '@nestjs/testing';

import Stripe from 'stripe';

// Commons
import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';

// Entities
import { Payment } from '../../entities/payment.entity';

// Services
import { PlatformWorkoutSettlementService } from '../platform-workout-settlement.service';

// Shared
import { StripeService } from '../../../../shared/stripe/stripe.service';

// Repositories
import { PaymentRepositoryToken } from '../../repositories/payment.repository.interface';

type StripeClientMock = {
  readonly transfers: {
    readonly create: jest.Mock<
      Promise<{ readonly id: string }>,
      [Record<string, unknown>, Record<string, unknown>]
    >;
  };
};

describe('PlatformWorkoutSettlementService', () => {
  let service: PlatformWorkoutSettlementService;
  let stripeClient: StripeClientMock;
  let stripeService: {
    getClient: jest.Mock;
  };
  let paymentRepo: {
    save: jest.Mock<Promise<void>, [Payment]>;
  };

  beforeEach(async () => {
    stripeClient = {
      transfers: {
        create: jest.fn<
          Promise<{ readonly id: string }>,
          [Record<string, unknown>, Record<string, unknown>]
        >(),
      },
    };
    stripeService = {
      getClient: jest
        .fn()
        .mockReturnValue(
          stripeClient as unknown as InstanceType<typeof Stripe>,
        ),
    };
    paymentRepo = {
      save: jest.fn<Promise<void>, [Payment]>().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformWorkoutSettlementService,
        { provide: StripeService, useValue: stripeService },
        { provide: PaymentRepositoryToken, useValue: paymentRepo },
      ],
    }).compile();

    service = module.get<PlatformWorkoutSettlementService>(
      PlatformWorkoutSettlementService,
    );
  });

  it('should return early when settlement model is not PLATFORM_COLLECT', async () => {
    const payment = {
      id: 'p1',
      currency: 'USD',
      metadata: { settlementModel: 'OTHER' },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(paymentRepo.save).not.toHaveBeenCalled();
  });

  it('should skip when already transferred', async () => {
    const payment = {
      id: 'p1',
      currency: 'USD',
      metadata: {
        settlementModel: 'PLATFORM_COLLECT',
        trainerPayout: { status: 'TRANSFERRED', transferId: 'tr_1' },
      },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(paymentRepo.save).not.toHaveBeenCalled();
  });

  it('should mark skipped when trainer share is zero', async () => {
    const payment = {
      id: 'p1',
      currency: 'USD',
      amountCents: 1000,
      status: PaymentStatus.PAID,
      metadata: { settlementModel: 'PLATFORM_COLLECT', trainerShareCents: 0 },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(paymentRepo.save).toHaveBeenCalledTimes(1);
    const savedPayment: Payment = paymentRepo.save.mock.calls[0][0];
    const metadata: unknown = savedPayment.metadata;
    expect(metadata).toBeTruthy();
    expect(typeof metadata).toBe('object');
    const trainerPayout: unknown = (metadata as Record<string, unknown>)
      .trainerPayout;
    expect(trainerPayout).toBeTruthy();
    expect((trainerPayout as Record<string, unknown>).status).toBe(
      'SKIPPED_ZERO_SHARE',
    );
  });

  it('should mark awaiting connect when destination is missing', async () => {
    const payment = {
      id: 'p1',
      currency: 'USD',
      amountCents: 1000,
      status: PaymentStatus.PAID,
      metadata: { settlementModel: 'PLATFORM_COLLECT', trainerShareCents: 500 },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(paymentRepo.save).toHaveBeenCalledTimes(1);
    const savedPayment: Payment = paymentRepo.save.mock.calls[0][0];
    const metadata: unknown = savedPayment.metadata;
    expect(metadata).toBeTruthy();
    expect(typeof metadata).toBe('object');
    const trainerPayout: unknown = (metadata as Record<string, unknown>)
      .trainerPayout;
    expect(trainerPayout).toBeTruthy();
    expect((trainerPayout as Record<string, unknown>).status).toBe(
      'AWAITING_TRAINER_CONNECT',
    );
  });

  it('should transfer trainer share and mark transferred', async () => {
    stripeClient.transfers.create.mockResolvedValue({ id: 'tr_1' });
    const payment = {
      id: 'p1',
      currency: 'USD',
      targetId: 'workout-1',
      amountCents: 1000,
      status: PaymentStatus.PAID,
      metadata: {
        settlementModel: 'PLATFORM_COLLECT',
        trainerShareCents: 500,
        trainerConnectAccountId: 'acct_1',
        currency: 'USD',
        workoutId: 'workout-1',
        trainerUserId: 'trainer-1',
      },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(stripeClient.transfers.create).toHaveBeenCalled();
    expect(paymentRepo.save).toHaveBeenCalledTimes(1);
    const savedPayment: Payment = paymentRepo.save.mock.calls[0][0];
    const metadata: unknown = savedPayment.metadata;
    expect(metadata).toBeTruthy();
    expect(typeof metadata).toBe('object');
    const trainerPayout: unknown = (metadata as Record<string, unknown>)
      .trainerPayout;
    expect(trainerPayout).toBeTruthy();
    expect((trainerPayout as Record<string, unknown>).status).toBe(
      'TRANSFERRED',
    );
    expect((trainerPayout as Record<string, unknown>).transferId).toBe('tr_1');
  });

  it('should mark failed when Stripe transfer throws', async () => {
    stripeClient.transfers.create.mockRejectedValue(new Error('stripe down'));
    const payment = {
      id: 'p1',
      currency: 'USD',
      targetId: 'workout-1',
      amountCents: 1000,
      status: PaymentStatus.PAID,
      metadata: {
        settlementModel: 'PLATFORM_COLLECT',
        trainerShareCents: 500,
        trainerConnectAccountId: 'acct_1',
        currency: 'USD',
        workoutId: 'workout-1',
        trainerUserId: 'trainer-1',
      },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(paymentRepo.save).toHaveBeenCalledTimes(1);
    const savedPayment: Payment = paymentRepo.save.mock.calls[0][0];
    const metadata: unknown = savedPayment.metadata;
    expect(metadata).toBeTruthy();
    expect(typeof metadata).toBe('object');
    const trainerPayout: unknown = (metadata as Record<string, unknown>)
      .trainerPayout;
    expect(trainerPayout).toBeTruthy();
    expect((trainerPayout as Record<string, unknown>).status).toBe('FAILED');
    expect((trainerPayout as Record<string, unknown>).errorMessage).toBe(
      'stripe down',
    );
  });

  it('should accept string trainerShareCents and primitive metadata fallbacks', async () => {
    stripeClient.transfers.create.mockResolvedValue({ id: 'tr_1' });
    const payment = {
      id: 'p1',
      currency: 'USD',
      targetId: 'workout-1',
      amountCents: 1000,
      status: PaymentStatus.PAID,
      metadata: {
        settlementModel: 'PLATFORM_COLLECT',
        trainerShareCents: '500',
        trainerConnectAccountId: 'acct_1',
        currency: 'USD',
        workoutId: 123,
        trainerUserId: true,
      },
    } as unknown as Payment;

    await service.applyTrainerShareTransferForPaidPayment(payment);

    expect(stripeClient.transfers.create).toHaveBeenCalledTimes(1);
    const transferParams: Record<string, unknown> =
      stripeClient.transfers.create.mock.calls[0][0];
    const metadata: unknown = transferParams.metadata;
    expect(transferParams.amount).toBe(500);
    expect(metadata).toBeTruthy();
    expect(typeof metadata).toBe('object');
    expect((metadata as Record<string, unknown>).workoutId).toBe('123');
    expect((metadata as Record<string, unknown>).trainerUserId).toBe('true');
  });
});
