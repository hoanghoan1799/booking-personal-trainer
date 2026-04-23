import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import Stripe from 'stripe';

// Commons
import { UserRole } from '../../../../common/enums/user/user.enum';
import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';

// Entities
import { Payment } from '../../entities/payment.entity';

// Services
import { TrainerStripeConnectService } from '../trainer-stripe-connect.service';
import { PlatformWorkoutSettlementService } from '../platform-workout-settlement.service';

// Shared
import { StripeService } from '../../../../shared/stripe/stripe.service';

// User service
import { UserService } from '../../../user/services/user.service';

type StripeClientMock = {
  readonly accounts: {
    readonly create: jest.Mock;
    readonly update: jest.Mock;
  };
  readonly accountLinks: {
    readonly create: jest.Mock;
  };
};

describe('TrainerStripeConnectService', () => {
  let service: TrainerStripeConnectService;
  let stripeClient: StripeClientMock;
  let stripeService: {
    getClient: jest.Mock;
  };
  let platformWorkoutSettlementService: {
    applyTrainerShareTransferForPaidPayment: jest.Mock;
  };
  let em: {
    find: jest.Mock;
    persist: jest.Mock;
  };
  let userService: {
    findByIdOrNull: jest.Mock;
    saveUser: jest.Mock;
  };

  beforeEach(async () => {
    stripeClient = {
      accounts: {
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      accountLinks: {
        create: jest.fn(),
      },
    };
    stripeService = {
      getClient: jest
        .fn()
        .mockReturnValue(
          stripeClient as unknown as InstanceType<typeof Stripe>,
        ),
    };
    platformWorkoutSettlementService = {
      applyTrainerShareTransferForPaidPayment: jest
        .fn()
        .mockResolvedValue(undefined),
    };
    em = {
      find: jest.fn(),
      persist: jest
        .fn()
        .mockReturnValue({ flush: jest.fn().mockResolvedValue(undefined) }),
    };
    userService = {
      findByIdOrNull: jest.fn(),
      saveUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerStripeConnectService,
        { provide: StripeService, useValue: stripeService },
        {
          provide: PlatformWorkoutSettlementService,
          useValue: platformWorkoutSettlementService,
        },
        { provide: EntityManager, useValue: em },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<TrainerStripeConnectService>(
      TrainerStripeConnectService,
    );
  });

  describe('createOnboardingLink', () => {
    it('should throw NotFoundException when user not found', async () => {
      userService.findByIdOrNull.mockResolvedValue(null);

      await expect(
        service.createOnboardingLink({ currentUserId: 'u1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when user is not trainer', async () => {
      userService.findByIdOrNull.mockResolvedValue({
        id: 'u1',
        role: UserRole.TRAINEE,
      });

      await expect(
        service.createOnboardingLink({ currentUserId: 'u1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when FRONTEND_URL is missing', async () => {
      userService.findByIdOrNull.mockResolvedValue({
        id: 'u1',
        role: UserRole.TRAINER,
      });
      delete process.env.FRONTEND_URL;

      await expect(
        service.createOnboardingLink({ currentUserId: 'u1' }),
      ).rejects.toThrow('FRONTEND_URL is required for Stripe onboarding links');
    });

    it('should create Stripe account when missing and backfill pending payouts', async () => {
      process.env.FRONTEND_URL = 'https://example.com';
      const user = {
        id: 'u1',
        role: UserRole.TRAINER,
        email: 't@test.com',
        stripeAccountId: null,
      };
      userService.findByIdOrNull.mockResolvedValue(user);
      stripeClient.accounts.create.mockResolvedValue({ id: 'acct_1' });
      stripeClient.accountLinks.create.mockResolvedValue({
        url: 'https://stripe.link',
      });
      em.find.mockResolvedValue([
        {
          id: 'p1',
          status: PaymentStatus.PAID,
          metadata: {
            settlementModel: 'PLATFORM_COLLECT',
            trainerUserId: 'u1',
            trainerPayout: { status: 'AWAITING_TRAINER_CONNECT' },
          },
        } as unknown as Payment,
      ]);

      const actual = await service.createOnboardingLink({
        currentUserId: 'u1',
      });

      expect(actual).toEqual({
        url: 'https://stripe.link',
        stripeAccountId: 'acct_1',
      });
      expect(userService.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ stripeAccountId: 'acct_1' }),
      );
      expect(
        platformWorkoutSettlementService.applyTrainerShareTransferForPaidPayment,
      ).toHaveBeenCalled();
    });
  });
});
