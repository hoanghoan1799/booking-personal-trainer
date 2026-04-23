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
  metadata?: { trainerUserId?: string; workoutId?: string } | null;
  paidAt?: Date | null;
  refundedAt?: Date | null;
  failureReason?: string | null;
};

type StripePaymentIntentSucceededEvent = {
  id: string;
  type: 'payment_intent.succeeded';
  data: { object: { id: string; status: 'succeeded' } };
};

type StripePaymentIntentFailedEvent = {
  id: string;
  type: 'payment_intent.payment_failed';
  data: {
    object: {
      id: string;
      status: 'requires_payment_method';
      last_payment_error?: { message?: string | null } | null;
    };
  };
};

type StripePaymentIntentCanceledEvent = {
  id: string;
  type: 'payment_intent.canceled';
  data: { object: { id: string; status: 'canceled' } };
};

type StripeChargeRefundedEvent = {
  id: string;
  type: 'charge.refunded';
  data: { object: { id: string; payment_intent?: string | null } };
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
    process.env.FRONTEND_URL = 'https://frontend.test/';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PaymentRepositoryToken, useValue: {} },
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

  it('should no-op for unrelated event types', async () => {
    await service.handleEvent({
      id: 'evt_1',
      type: 'customer.created',
      data: { object: {} },
    });

    expect(em.transactional).not.toHaveBeenCalled();
  });

  it('should ignore duplicate webhook events (unique violation)', async () => {
    const uniqueErr: Readonly<{ code: string }> = { code: '23505' };
    const persistFlushMock = jest.fn().mockRejectedValue(uniqueErr);
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: persistFlushMock }),
          findOne: jest.fn(),
          flush: jest.fn(),
        }),
    );

    const event: StripePaymentIntentSucceededEvent = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    };

    await service.handleEvent(event);

    expect(persistFlushMock).toHaveBeenCalled();
    expect(
      platformSettlement.applyTrainerShareTransferForPaidPayment,
    ).not.toHaveBeenCalled();
  });

  it('should rethrow unexpected persistence errors for processed events', async () => {
    const persistFlushMock = jest.fn().mockRejectedValue(new Error('db down'));
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: persistFlushMock }),
          findOne: jest.fn(),
          flush: jest.fn(),
        }),
    );

    const event: StripePaymentIntentSucceededEvent = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    };

    await expect(service.handleEvent(event)).rejects.toThrow('db down');
  });

  it('should return early when payment is not found', async () => {
    const flushMock = jest.fn().mockResolvedValue(undefined);
    const findOneMock = jest.fn().mockResolvedValue(null);
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: findOneMock,
          flush: flushMock,
        }),
    );

    const event: StripePaymentIntentSucceededEvent = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    };

    await service.handleEvent(event);

    expect(findOneMock).toHaveBeenCalled();
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('should skip processing when payment already PAID', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PAID,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: { trainerUserId: 'trainer_1', workoutId: 'workout_1' },
    };
    const flushMock = jest.fn().mockResolvedValue(undefined);
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: jest.fn().mockResolvedValue(payment),
          flush: flushMock,
        }),
    );

    const event: StripePaymentIntentSucceededEvent = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    };

    await service.handleEvent(event);

    expect(flushMock).not.toHaveBeenCalled();
    expect(
      platformSettlement.applyTrainerShareTransferForPaidPayment,
    ).not.toHaveBeenCalled();
  });

  it('should send admin email even when trainerUserId missing', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: null,
    };
    userService.getAdminEmailAddresses.mockResolvedValue(['admin@test.com']);
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

    expect(notificationsService.createAndPublishToUsers).not.toHaveBeenCalled();
    expect(emailService.send).toHaveBeenCalled();
  });

  it('should not send trainer email when trainer user not found', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'usd',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: { trainerUserId: 'trainer_1', workoutId: 'workout_1' },
    };
    userService.findByIdOrNull.mockResolvedValue(null);
    userService.getAdminEmailAddresses.mockResolvedValue(['admin@test.com']);
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

    expect(notificationsService.createAndPublishToUsers).toHaveBeenCalled();
    const sendCalls: unknown[] = emailService.send.mock.calls;
    expect(sendCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should mark payment FAILED with fallback reason', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: {},
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

    const event: StripePaymentIntentFailedEvent = {
      id: 'evt_2',
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_123', status: 'requires_payment_method' } },
    };

    await service.handleEvent(event);

    expect(payment.status).toBe(PaymentStatus.FAILED);
    expect(payment.failureReason).toBe('Payment failed');
  });

  it('should set failureReason from last_payment_error message', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: {},
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

    const event: StripePaymentIntentFailedEvent = {
      id: 'evt_2',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_123',
          status: 'requires_payment_method',
          last_payment_error: { message: 'Card declined' },
        },
      },
    };

    await service.handleEvent(event);

    expect(payment.status).toBe(PaymentStatus.FAILED);
    expect(payment.failureReason).toBe('Card declined');
  });

  it('should skip failed handler when payment already PAID', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PAID,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: {},
    };
    const flushMock = jest.fn().mockResolvedValue(undefined);
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: jest.fn().mockResolvedValue(payment),
          flush: flushMock,
        }),
    );

    const event: StripePaymentIntentFailedEvent = {
      id: 'evt_2',
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_123', status: 'requires_payment_method' } },
    };

    await service.handleEvent(event);

    expect(flushMock).not.toHaveBeenCalled();
  });

  it('should mark payment CANCELLED on payment_intent.canceled', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: {},
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

    const event: StripePaymentIntentCanceledEvent = {
      id: 'evt_3',
      type: 'payment_intent.canceled',
      data: { object: { id: 'pi_123', status: 'canceled' } },
    };

    await service.handleEvent(event);

    expect(payment.status).toBe(PaymentStatus.CANCELLED);
  });

  it('should skip cancel handler when payment already PAID', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PAID,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: {},
    };
    const flushMock = jest.fn().mockResolvedValue(undefined);
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: jest.fn().mockResolvedValue(payment),
          flush: flushMock,
        }),
    );

    const event: StripePaymentIntentCanceledEvent = {
      id: 'evt_3',
      type: 'payment_intent.canceled',
      data: { object: { id: 'pi_123', status: 'canceled' } },
    };

    await service.handleEvent(event);

    expect(flushMock).not.toHaveBeenCalled();
  });

  it('should mark payment REFUNDED on charge.refunded when payment_intent present', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PAID,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: {},
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

    const event: StripeChargeRefundedEvent = {
      id: 'evt_4',
      type: 'charge.refunded',
      data: { object: { id: 'ch_1', payment_intent: 'pi_123' } },
    };

    await service.handleEvent(event);

    expect(payment.status).toBe(PaymentStatus.REFUNDED);
    expect(payment.metadata && 'stripeRefunded' in payment.metadata).toBe(true);
  });

  it('should ignore succeeded event when payment intent object is invalid', async () => {
    const flushMock = jest.fn();
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: jest.fn(),
          flush: flushMock,
        }),
    );

    await service.handleEvent({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { status: 'succeeded' } },
    });

    expect(flushMock).not.toHaveBeenCalled();
  });

  it('should not publish trainer notification when trainerUserId is not a string', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: { trainerUserId: undefined, workoutId: 'workout_1' },
    };
    userService.getAdminEmailAddresses.mockResolvedValue(['admin@test.com']);
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

    expect(notificationsService.createAndPublishToUsers).not.toHaveBeenCalled();
    expect(emailService.send).toHaveBeenCalled();
  });

  it('uses current time in email payload when paidAt is missing', async () => {
    const payment: PaymentFixture = {
      id: 'payment_1',
      status: PaymentStatus.PROCESSING,
      amountCents: 5000,
      currency: 'USD',
      payer: { id: 'trainee_1', userName: 'trainee' },
      metadata: { trainerUserId: 'trainer_1', workoutId: 'workout_1' },
      paidAt: null,
    };
    userService.getAdminEmailAddresses.mockResolvedValue(['admin@test.com']);
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

    expect(emailService.send).toHaveBeenCalled();
  });

  it('should ignore charge.refunded when payment_intent is missing', async () => {
    const findOneMock = jest.fn();
    em.transactional.mockImplementation(
      (handler: TransactionalHandler<unknown>) =>
        handler({
          create: jest.fn().mockReturnValue({}),
          persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
          findOne: findOneMock,
          flush: jest.fn(),
        }),
    );

    const event: StripeChargeRefundedEvent = {
      id: 'evt_4',
      type: 'charge.refunded',
      data: { object: { id: 'ch_1' } },
    };

    await service.handleEvent(event);

    expect(findOneMock).not.toHaveBeenCalled();
  });
});
