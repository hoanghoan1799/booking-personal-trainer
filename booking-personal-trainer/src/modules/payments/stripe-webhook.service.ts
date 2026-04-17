import { Inject, Injectable } from '@nestjs/common';

// Commons
import { PaymentStatus } from '../../common/enums/billing/billing.enum';

// Repositories
import type { PaymentRepository } from './repositories/payment.repository.interface';
import { PaymentRepositoryToken } from './repositories/payment.repository.interface';
import { PlatformWorkoutSettlementService } from './platform-workout-settlement.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationTemplates } from '../notifications/constants/notification-template.constant';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import type { UserRepository } from '../user/repositories/user.repository.interface';
import { EmailService } from '../email/email.service';
import { EmailTemplates } from '../email/constants/email-template.constant';
import { collectAdminEmailAddresses } from '../email/helpers/collect-admin-email-addresses.helper';

const STRIPE_PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded' as const;
const STRIPE_PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed' as const;
const STRIPE_PAYMENT_INTENT_CANCELED = 'payment_intent.canceled' as const;
const STRIPE_CHARGE_REFUNDED = 'charge.refunded' as const;

@Injectable()
export class StripeWebhookService {
  constructor(
    @Inject(PaymentRepositoryToken)
    private readonly paymentRepo: PaymentRepository,
    private readonly platformWorkoutSettlementService: PlatformWorkoutSettlementService,
    private readonly notificationsService: NotificationsService,
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async handleEvent(event: {
    type: string;
    data: { object: unknown };
  }): Promise<void> {
    switch (event.type) {
      case STRIPE_PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentIntentSucceeded(event.data.object as any);
        return;
      case STRIPE_PAYMENT_INTENT_FAILED:
        await this.handlePaymentIntentFailed(event.data.object as any);
        return;
      case STRIPE_PAYMENT_INTENT_CANCELED:
        await this.handlePaymentIntentCanceled(event.data.object as any);
        return;
      case STRIPE_CHARGE_REFUNDED:
        await this.handleChargeRefunded(event.data.object as any);
        return;
      default:
        return;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: {
    id: string;
    status: string;
  }): Promise<void> {
    const payment = await this.paymentRepo.findByProviderPaymentIntentId(
      paymentIntent.id,
    );
    if (!payment) return;
    if (payment.status === PaymentStatus.PAID) return;
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.failureReason = null;
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(payment);
    await this.platformWorkoutSettlementService.applyTrainerShareTransferForPaidPayment(
      payment,
    );
    const metadata =
      (payment.metadata as Record<string, unknown> | null | undefined) ?? null;
    const trainerUserId =
      metadata && typeof metadata.trainerUserId === 'string'
        ? metadata.trainerUserId
        : null;
    const workoutId =
      metadata && typeof metadata.workoutId === 'string'
        ? metadata.workoutId
        : null;
    if (trainerUserId) {
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: trainerUserId,
            type: NotificationType.TrainerTraineePaidForWorkout,
            ...NotificationTemplates.trainerTraineePaidForWorkout({
              traineeUserName: payment.payer.userName,
            }),
            data: {
              workoutId,
              trainerUserId,
              traineeId: payment.payer.id,
              amountCents: payment.amountCents,
              currency: payment.currency,
              paymentId: payment.id,
            },
          },
        ],
      });
      const trainerUser = await this.userRepo.findById(trainerUserId);
      const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
        /\/$/,
        '',
      );
      const trainerName: string = trainerUser?.userName ?? 'Unknown';
      const amount: string =
        `${(payment.amountCents / 100).toFixed(2)} ${String(
          payment.currency ?? '',
        ).toUpperCase()}`.trim();
      const trainerPaidEmail = EmailTemplates.trainerTraineePaidForWorkout({
        traineeName: payment.payer.userName,
        trainerName,
        amount,
        workoutTitle: workoutId ? `Workout ${workoutId}` : 'Workout',
        paidAt: (payment.paidAt ?? new Date()).toISOString(),
        paymentUrl: `${frontendUrl}/trainer/payments/${payment.id}`,
      });
      if (trainerUser) {
        await this.emailService.send({
          to: trainerUser.email,
          subject: trainerPaidEmail.subject,
          text: trainerPaidEmail.text,
          html: trainerPaidEmail.html,
        });
      }
    }
    await this.notificationsService.notifyAdmins({
      type: NotificationType.AdminTraineePaidForWorkout,
      ...NotificationTemplates.adminTraineePaidForWorkout({
        traineeUserName: payment.payer.userName,
      }),
      data: {
        workoutId,
        trainerUserId,
        traineeId: payment.payer.id,
        amountCents: payment.amountCents,
        currency: payment.currency,
        paymentId: payment.id,
      },
    });
    const adminEmails = await collectAdminEmailAddresses(this.userRepo);
    const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
      /\/$/,
      '',
    );
    const trainerUser = trainerUserId
      ? await this.userRepo.findById(trainerUserId)
      : null;
    const trainerName: string = trainerUser?.userName ?? 'Unknown';
    const amount: string = `${(payment.amountCents / 100).toFixed(2)} ${String(
      payment.currency ?? '',
    ).toUpperCase()}`.trim();
    const adminPaidEmail = EmailTemplates.adminTraineePaidForWorkout({
      traineeName: payment.payer.userName,
      trainerName,
      amount,
      workoutTitle: workoutId ? `Workout ${workoutId}` : 'Workout',
      paidAt: (payment.paidAt ?? new Date()).toISOString(),
      paymentUrl: `${frontendUrl}/admin/payments/${payment.id}`,
    });
    await this.emailService.send({
      to: adminEmails,
      subject: adminPaidEmail.subject,
      text: adminPaidEmail.text,
      html: adminPaidEmail.html,
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: {
    id: string;
    status: string;
    last_payment_error?: { message?: string | null } | null;
  }): Promise<void> {
    const payment = await this.paymentRepo.findByProviderPaymentIntentId(
      paymentIntent.id,
    );
    if (!payment) return;
    if (payment.status === PaymentStatus.PAID) return;
    payment.status = PaymentStatus.FAILED;
    payment.failureReason =
      paymentIntent.last_payment_error?.message ?? 'Payment failed';
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(payment);
  }

  private async handlePaymentIntentCanceled(paymentIntent: {
    id: string;
    status: string;
  }): Promise<void> {
    const payment = await this.paymentRepo.findByProviderPaymentIntentId(
      paymentIntent.id,
    );
    if (!payment) return;
    if (payment.status === PaymentStatus.PAID) return;
    payment.status = PaymentStatus.CANCELLED;
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(payment);
  }

  private async handleChargeRefunded(charge: {
    id: string;
    payment_intent?: string | null;
  }): Promise<void> {
    const paymentIntentId: string | null =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
    if (!paymentIntentId) return;
    const payment =
      await this.paymentRepo.findByProviderPaymentIntentId(paymentIntentId);
    if (!payment) return;
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeChargeId: charge.id,
      stripeRefunded: true,
    };
    await this.paymentRepo.save(payment);
  }
}
