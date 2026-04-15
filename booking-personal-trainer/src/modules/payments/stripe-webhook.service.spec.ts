/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';

import { StripeWebhookService } from './stripe-webhook.service';
import { PaymentRepositoryToken } from './repositories/payment.repository.interface';
import { PaymentStatus } from '../../common/enums/billing/billing.enum';
import { PlatformWorkoutSettlementService } from './platform-workout-settlement.service';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let paymentRepo: {
    findByProviderPaymentIntentId: jest.Mock;
    save: jest.Mock;
  };
  let platformSettlement: {
    applyTrainerShareTransferForPaidPayment: jest.Mock;
  };

  beforeEach(async () => {
    paymentRepo = {
      findByProviderPaymentIntentId: jest.fn(),
      save: jest.fn(),
    };
    platformSettlement = {
      applyTrainerShareTransferForPaidPayment: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PaymentRepositoryToken, useValue: paymentRepo },
        {
          provide: PlatformWorkoutSettlementService,
          useValue: platformSettlement,
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('should mark payment PAID on payment_intent.succeeded', async () => {
    const payment = { status: PaymentStatus.PROCESSING } as any;
    paymentRepo.findByProviderPaymentIntentId.mockResolvedValue(payment);

    const event = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    } as any;

    await service.handleEvent(event);

    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(paymentRepo.save).toHaveBeenCalledWith(payment);
    expect(
      platformSettlement.applyTrainerShareTransferForPaidPayment,
    ).toHaveBeenCalledWith(payment);
  });
});
