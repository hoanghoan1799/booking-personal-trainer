/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';

import { StripeWebhookService } from './stripe-webhook.service';
import { PaymentRepositoryToken } from './repositories/payment.repository.interface';
import { PaymentStatus } from '../../common/enums/billing/billing.enum';
import { PlatformWorkoutSettlementService } from './platform-workout-settlement.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import { EmailService } from '../email/email.service';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let paymentRepo: {
    findByProviderPaymentIntentId: jest.Mock;
    save: jest.Mock;
  };
  let platformSettlement: {
    applyTrainerShareTransferForPaidPayment: jest.Mock;
  };
  let notificationsService: {
    createAndPublishToUsers: jest.Mock;
    notifyAdmins: jest.Mock;
  };
  let userRepo: { findById: jest.Mock; findAndCount: jest.Mock };
  let emailService: { send: jest.Mock };

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
    notificationsService = {
      createAndPublishToUsers: jest.fn().mockResolvedValue([]),
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
    };
    userRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'trainer_1',
        email: 'trainer@test.com',
      }),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PaymentRepositoryToken, useValue: paymentRepo },
        {
          provide: PlatformWorkoutSettlementService,
          useValue: platformSettlement,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        { provide: UserRepositoryToken, useValue: userRepo },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('should mark payment PAID on payment_intent.succeeded', async () => {
    const payment = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: { trainerUserId: 'trainer_1', workoutId: 'workout_1' },
    } as any;
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
    expect(notificationsService.notifyAdmins).toHaveBeenCalled();
  });
});
