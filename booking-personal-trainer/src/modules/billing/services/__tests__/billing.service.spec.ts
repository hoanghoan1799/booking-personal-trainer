import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

// Commons
import {
  BillableTargetType,
  BillingChargeStatus,
} from '../../../../common/enums/billing/billing.enum';

// Entities
import { BillingCharge } from '../../entities/billing-charge.entity';
import { Workout } from '../../../workout/entities/workout.entity';
import { User } from '../../../user/entities/user.entity';

// Services
import { BillingService } from '../billing.service';

// Repositories
import { BillingChargeRepositoryToken } from '../../repositories/billing-charge.repository.interface';
import { BillingConstants } from '../../constants/billing.constants';

const WORKOUT_ID = 'workout-id';
const PAYER_USER_ID = 'payer-user-id';
const CHARGE_ID = 'charge-id';
const AMOUNT_CENTS = 2500;
const MINIMUM_AMOUNT = BillingConstants.MinimumAmountCents;
const DEFAULT_CURRENCY = BillingConstants.DefaultCurrency;

describe('BillingService', () => {
  let service: BillingService;
  let billingChargeRepo: {
    create: jest.Mock;
    findById: jest.Mock;
    findLatestActiveForTarget: jest.Mock;
    expireMany: jest.Mock;
    save: jest.Mock;
  };
  let em: {
    findOne: jest.Mock;
    transactional: jest.Mock;
  };

  beforeEach(async () => {
    billingChargeRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findLatestActiveForTarget: jest.fn(),
      expireMany: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    em = {
      findOne: jest.fn(),
      transactional: jest.fn(async (callback: () => Promise<void>) => {
        await callback();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: BillingChargeRepositoryToken,
          useValue: billingChargeRepo,
        },
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('createWorkoutCharge', () => {
    it('should throw BadRequestException when amount is less than minimum', async () => {
      await expect(
        service.createWorkoutCharge({
          workoutId: WORKOUT_ID,
          payerUserId: PAYER_USER_ID,
          amountCents: MINIMUM_AMOUNT - 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when workout not found', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.createWorkoutCharge({
          workoutId: WORKOUT_ID,
          payerUserId: PAYER_USER_ID,
          amountCents: AMOUNT_CENTS,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create draft charge with defaults when valid', async () => {
      em.findOne.mockResolvedValue({ id: WORKOUT_ID } as Workout);
      const mockCharge = {
        id: CHARGE_ID,
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
        status: BillingChargeStatus.DRAFT,
      } as BillingCharge;
      billingChargeRepo.create.mockResolvedValue(mockCharge);

      const actual = await service.createWorkoutCharge({
        workoutId: WORKOUT_ID,
        payerUserId: PAYER_USER_ID,
        amountCents: AMOUNT_CENTS,
      });

      expect(actual).toEqual(mockCharge);
      expect(billingChargeRepo.create).toHaveBeenCalledWith({
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
        payerUserId: PAYER_USER_ID,
        amountCents: AMOUNT_CENTS,
        currency: DEFAULT_CURRENCY,
        status: BillingChargeStatus.DRAFT,
        metadata: null,
        expiresAt: null,
      });
    });
  });

  describe('activateCharge', () => {
    it('should throw NotFoundException when charge not found', async () => {
      billingChargeRepo.findById.mockResolvedValue(null);

      await expect(service.activateCharge(CHARGE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return charge when status is not DRAFT', async () => {
      const charge = {
        id: CHARGE_ID,
        status: BillingChargeStatus.ACTIVE,
      } as BillingCharge;
      billingChargeRepo.findById.mockResolvedValue(charge);

      const actual = await service.activateCharge(CHARGE_ID);

      expect(actual).toBe(charge);
      expect(em.transactional).not.toHaveBeenCalled();
      expect(billingChargeRepo.save).not.toHaveBeenCalled();
    });

    it('should expire old charges and activate draft charge in transaction', async () => {
      const charge = {
        id: CHARGE_ID,
        status: BillingChargeStatus.DRAFT,
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
      } as BillingCharge;
      billingChargeRepo.findById.mockResolvedValue(charge);
      billingChargeRepo.expireMany.mockResolvedValue(1);

      const actual = await service.activateCharge(CHARGE_ID);

      expect(actual.status).toBe(BillingChargeStatus.ACTIVE);
      expect(em.transactional).toHaveBeenCalledTimes(1);
      expect(billingChargeRepo.expireMany).toHaveBeenCalledWith({
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
        status: BillingChargeStatus.ACTIVE,
      });
      expect(billingChargeRepo.save).toHaveBeenCalledWith(charge);
    });
  });

  describe('expireOldChargesForTarget', () => {
    it('should call repository expireMany with ACTIVE status', async () => {
      billingChargeRepo.expireMany.mockResolvedValue(2);

      const actual = await service.expireOldChargesForTarget({
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
      });

      expect(actual).toBe(2);
      expect(billingChargeRepo.expireMany).toHaveBeenCalledWith({
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
        status: BillingChargeStatus.ACTIVE,
      });
    });
  });

  describe('getLatestActiveWorkoutCharge', () => {
    it('should return latest active charge for workout', async () => {
      const charge = {
        id: CHARGE_ID,
        targetType: BillableTargetType.WORKOUT,
        targetId: WORKOUT_ID,
        status: BillingChargeStatus.ACTIVE,
      } as BillingCharge;
      billingChargeRepo.findLatestActiveForTarget.mockResolvedValue(charge);

      const actual = await service.getLatestActiveWorkoutCharge(WORKOUT_ID);

      expect(actual).toBe(charge);
      expect(billingChargeRepo.findLatestActiveForTarget).toHaveBeenCalledWith(
        BillableTargetType.WORKOUT,
        WORKOUT_ID,
      );
    });
  });

  describe('createAndActivateWorkoutChargeAtomic', () => {
    it('should throw BadRequestException when amount is less than minimum', async () => {
      const txEm = {} as EntityManager;

      await expect(
        service.createAndActivateWorkoutChargeAtomic({
          em: txEm,
          workoutId: WORKOUT_ID,
          payerUserId: PAYER_USER_ID,
          amountCents: MINIMUM_AMOUNT - 1,
          currency: DEFAULT_CURRENCY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when workout not found', async () => {
      const txEm = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as EntityManager;

      await expect(
        service.createAndActivateWorkoutChargeAtomic({
          em: txEm,
          workoutId: WORKOUT_ID,
          payerUserId: PAYER_USER_ID,
          amountCents: AMOUNT_CENTS,
          currency: DEFAULT_CURRENCY,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should expire active charges and persist new active charge', async () => {
      const flushMock = jest.fn().mockResolvedValue(undefined);
      const persistResult = { flush: flushMock };
      const createdCharge = { id: CHARGE_ID } as BillingCharge;
      const findOneMock = jest
        .fn()
        .mockResolvedValue({ id: WORKOUT_ID } as Workout);
      const nativeUpdateMock = jest.fn().mockResolvedValue(1);
      const createMock = jest.fn().mockReturnValue(createdCharge);
      const getReferenceMock = jest
        .fn()
        .mockReturnValue({ id: PAYER_USER_ID } as User);
      const persistMock = jest.fn().mockReturnValue(persistResult);
      const txEm = {
        findOne: findOneMock,
        nativeUpdate: nativeUpdateMock,
        create: createMock,
        getReference: getReferenceMock,
        persist: persistMock,
      } as unknown as EntityManager;

      const actual = await service.createAndActivateWorkoutChargeAtomic({
        em: txEm,
        workoutId: WORKOUT_ID,
        payerUserId: PAYER_USER_ID,
        amountCents: AMOUNT_CENTS,
        currency: DEFAULT_CURRENCY,
        metadata: { source: 'test' },
        expiresAt: null,
      });

      expect(actual).toBe(createdCharge);
      expect(nativeUpdateMock).toHaveBeenCalledWith(
        BillingCharge,
        {
          targetType: BillableTargetType.WORKOUT,
          targetId: WORKOUT_ID,
          status: BillingChargeStatus.ACTIVE,
        },
        {
          status: BillingChargeStatus.EXPIRED,
        },
      );
      expect(createMock).toHaveBeenCalledWith(
        BillingCharge,
        expect.objectContaining({
          targetType: BillableTargetType.WORKOUT,
          targetId: WORKOUT_ID,
          amountCents: AMOUNT_CENTS,
          currency: DEFAULT_CURRENCY,
          status: BillingChargeStatus.ACTIVE,
          metadata: { source: 'test' },
          expiresAt: null,
        }),
      );
      expect(persistMock).toHaveBeenCalledWith(createdCharge);
      expect(flushMock).toHaveBeenCalledTimes(1);
    });
  });
});
