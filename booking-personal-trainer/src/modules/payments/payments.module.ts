import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Payment } from './entities/payment.entity';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';

// Modules
import { BillingModule } from '../billing/billing.module';
import { StripeModule } from '../../shared/stripe/stripe.module';

// Services
import { PaymentsService } from './payments.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { WorkoutPaymentPolicyService } from './workout-payment-policy.service';

// Controllers
import { WorkoutPaymentsController } from './workout-payments.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { TrainerStripeConnectController } from './trainer-stripe-connect.controller';

// Repositories
import { PaymentRepositoryToken } from './repositories/payment.repository.interface';
import { MikroOrmPaymentRepository } from './repositories/mikroorm-payment.repository';
import { TrainerStripeConnectService } from './trainer-stripe-connect.service';
import { PlatformWorkoutSettlementService } from './platform-workout-settlement.service';
import { UserModule } from '../user/user.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { AdminEarningsController } from './admin-earnings.controller';
import { AdminEarningsService } from './admin-earnings.service';
import { TrainerPayoutsController } from './trainer-payouts.controller';
import { TrainerPayoutsService } from './trainer-payouts.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Payment, ProcessedWebhookEvent]),
    StripeModule,
    forwardRef(() => BillingModule),
    forwardRef(() => UserModule),
    NotificationsModule,
    EmailModule,
  ],
  controllers: [
    WorkoutPaymentsController,
    StripeWebhookController,
    TrainerStripeConnectController,
    AdminEarningsController,
    TrainerPayoutsController,
  ],
  providers: [
    PaymentsService,
    StripeWebhookService,
    WorkoutPaymentPolicyService,
    TrainerStripeConnectService,
    PlatformWorkoutSettlementService,
    AdminEarningsService,
    TrainerPayoutsService,
    {
      provide: PaymentRepositoryToken,
      useClass: MikroOrmPaymentRepository,
    },
  ],
  exports: [
    PaymentsService,
    WorkoutPaymentPolicyService,
    PaymentRepositoryToken,
  ],
})
export class PaymentsModule {}
