import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Payment } from './entities/payment.entity';

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

@Module({
  imports: [
    MikroOrmModule.forFeature([Payment]),
    StripeModule,
    forwardRef(() => BillingModule),
    forwardRef(() => UserModule),
  ],
  controllers: [
    WorkoutPaymentsController,
    StripeWebhookController,
    TrainerStripeConnectController,
  ],
  providers: [
    PaymentsService,
    StripeWebhookService,
    WorkoutPaymentPolicyService,
    TrainerStripeConnectService,
    PlatformWorkoutSettlementService,
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
