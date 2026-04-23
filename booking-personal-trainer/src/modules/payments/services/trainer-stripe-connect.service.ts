import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

// Commons
import { UserRole } from '../../../common/enums/user/user.enum';
import { PaymentStatus } from '../../../common/enums/billing/billing.enum';

// Entities
import { User } from '../../user/entities/user.entity';
import { Payment } from '../entities/payment.entity';

import { UserService } from '../../user/services/user.service';

// Shared
import { StripeService } from '../../../shared/stripe/stripe.service';
import { PlatformWorkoutSettlementService } from './platform-workout-settlement.service';

type StripeConnectOnboardingResult = {
  readonly url: string;
  readonly stripeAccountId: string;
};

@Injectable()
export class TrainerStripeConnectService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly platformWorkoutSettlementService: PlatformWorkoutSettlementService,
    private readonly em: EntityManager,
    private readonly userService: UserService,
  ) {}

  async createOnboardingLink(input: {
    readonly currentUserId: string;
  }): Promise<StripeConnectOnboardingResult> {
    const user: User | null = await this.userService.findByIdOrNull(
      input.currentUserId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.TRAINER) {
      throw new BadRequestException('Only trainers can onboard Stripe Connect');
    }
    const frontendUrl: string | undefined = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is required for Stripe onboarding links');
    }
    const stripeClient = this.stripeService.getClient();
    const stripeAccountId: string =
      user.stripeAccountId ??
      (
        await stripeClient.accounts.create({
          type: 'express',
          email: user.email,
          metadata: { userId: user.id },
          capabilities: { transfers: { requested: true } },
        })
      ).id;
    if (!user.stripeAccountId) {
      user.stripeAccountId = stripeAccountId;
      await this.userService.saveUser(user);
      await this.backfillAndSettlePendingTrainerPayouts({
        trainerUserId: user.id,
        stripeAccountId,
      });
    }
    await stripeClient.accounts.update(stripeAccountId, {
      capabilities: { transfers: { requested: true } },
    });
    const accountLink = await stripeClient.accountLinks.create({
      account: stripeAccountId,
      type: 'account_onboarding',
      refresh_url: `${frontendUrl}/stripe/connect/refresh`,
      return_url: `${frontendUrl}/stripe/connect/return`,
    });
    return { url: accountLink.url, stripeAccountId };
  }

  private async backfillAndSettlePendingTrainerPayouts(input: {
    readonly trainerUserId: string;
    readonly stripeAccountId: string;
  }): Promise<void> {
    const payments = await this.em.find(
      Payment,
      {
        status: PaymentStatus.PAID,
        metadata: {
          settlementModel: 'PLATFORM_COLLECT',
          trainerUserId: input.trainerUserId,
          trainerPayout: { status: 'AWAITING_TRAINER_CONNECT' },
        },
      } as unknown as Record<string, unknown>,
      { orderBy: { createdAt: 'DESC' } },
    );

    for (const payment of payments) {
      const meta = { ...(payment.metadata ?? {}) } as Record<string, unknown>;
      meta.trainerConnectAccountId = input.stripeAccountId;
      payment.metadata = meta;
      await this.em.persist(payment).flush();
      await this.platformWorkoutSettlementService.applyTrainerShareTransferForPaidPayment(
        payment,
      );
    }
  }
}
