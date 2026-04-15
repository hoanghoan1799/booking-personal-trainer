import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Commons
import { UserRole } from '../../common/enums/user/user.enum';

// Entities
import { User } from '../user/entities/user.entity';

// Repositories
import {
  UserRepositoryToken,
  type UserRepository,
} from '../user/repositories/user.repository.interface';

// Shared
import { StripeService } from '../../shared/stripe/stripe.service';

type StripeConnectOnboardingResult = {
  readonly url: string;
  readonly stripeAccountId: string;
};

@Injectable()
export class TrainerStripeConnectService {
  constructor(
    private readonly stripeService: StripeService,
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
  ) {}

  async createOnboardingLink(input: {
    readonly currentUserId: string;
  }): Promise<StripeConnectOnboardingResult> {
    const user: User | null = await this.userRepo.findById(input.currentUserId);
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
        })
      ).id;
    if (!user.stripeAccountId) {
      user.stripeAccountId = stripeAccountId;
      await this.userRepo.save(user);
    }
    const accountLink = await stripeClient.accountLinks.create({
      account: stripeAccountId,
      type: 'account_onboarding',
      refresh_url: `${frontendUrl}/stripe/connect/refresh`,
      return_url: `${frontendUrl}/stripe/connect/return`,
    });
    return { url: accountLink.url, stripeAccountId };
  }
}
