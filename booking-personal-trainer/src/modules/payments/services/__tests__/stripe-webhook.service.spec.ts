import { Test, TestingModule } from '@nestjs/testing';

import { StripeWebhookService } from '../stripe-webhook.service';
import { PaymentRepositoryToken } from '../../repositories/payment.repository.interface';
import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';
import { PlatformWorkoutSettlementService } from '../platform-workout-settlement.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { UserService } from '../../../user/services/user.service';
import { EmailService } from '../../../email/services/email.service';
import { EntityManager } from '@mikro-orm/core';

type PaymentFixture = {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  payer: { id: string; userName: string };
  metadata: { trainerUserId: string; workoutId: string };
};

type StripePaymentIntentSucceededEvent = {
  id: string;
  type: 'payment_intent.succeeded';
  data: { object: { id: string; status: 'succeeded' } };
};

type TransactionalEntityManagerMock = {
  readonly create: jest.Mock;
  readonly persist: jest.Mock;
  readonly findOne: jest.Mock;
  readonly flush: jest.Mock;
};

type TransactionalHandler<T> = (
  em: TransactionalEntityManagerMock,
) => Promise<T>;

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
  let userService: {
    findByIdOrNull: jest.Mock;
    getAdminEmailAddresses: jest.Mock;
  };
  let emailService: { send: jest.Mock };
  let em: { transactional: jest.Mock };

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
    userService = {
      findByIdOrNull: jest.fn().mockResolvedValue({
        id: 'trainer_1',
        email: 'trainer@test.com',
      }),
      getAdminEmailAddresses: jest.fn().mockResolvedValue([]),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };
    em = {
      transactional: jest.fn(),
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
        { provide: UserService, useValue: userService },
        { provide: EmailService, useValue: emailService },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('should mark payment PAID on payment_intent.succeeded', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: { trainerUserId: 'trainer_1', workoutId: 'workout_1' },
    };
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: jest.fn().mockResolvedValue(payment),
          flush: jest.fn().mockResolvedValue(undefined),
        }),
    );

    const event: StripePaymentIntentSucceededEvent = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    };

    await service.handleEvent(event);

    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(
      platformSettlement.applyTrainerShareTransferForPaidPayment,
    ).toHaveBeenCalledWith(payment);
    expect(notificationsService.notifyAdmins).toHaveBeenCalled();
  });
});
