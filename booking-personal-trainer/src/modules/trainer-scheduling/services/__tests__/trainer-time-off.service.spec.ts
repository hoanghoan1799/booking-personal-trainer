import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TrainerTimeOffService } from '../../services/trainer-time-off.service';
import { TrainerTimeOffRepositoryToken } from '../../repositories/trainer-time-off.repository.interface';
import { TrainerScheduleConflictService } from '../../services/trainer-schedule-conflict.service';
import type { User } from '../../../../modules/user/entities/user.entity';

describe('TrainerTimeOffService', () => {
  let service: TrainerTimeOffService;
  let timeOffRepository: {
    findAndCount: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    findOverlappingForTrainer?: jest.Mock;
    findOverlappingRangesForTrainer?: jest.Mock;
  };
  let scheduleConflictService: {
    assertNoOverlap: jest.Mock;
  };

  beforeEach(async () => {
    timeOffRepository = {
      findAndCount: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findOverlappingForTrainer: jest.fn(),
      findOverlappingRangesForTrainer: jest.fn(),
    };
    scheduleConflictService = {
      assertNoOverlap: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerTimeOffService,
        {
          provide: TrainerTimeOffRepositoryToken,
          useValue: timeOffRepository,
        },
        {
          provide: TrainerScheduleConflictService,
          useValue: scheduleConflictService,
        },
      ],
    }).compile();

    service = module.get<TrainerTimeOffService>(TrainerTimeOffService);
  });

  describe('getMyTimeOff', () => {
    it('should return paginated response', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findAndCount.mockResolvedValue([[{ id: 'o1' }], 1]);

      const actual = await service.getMyTimeOff(currentUser);

      expect(timeOffRepository.findAndCount).toHaveBeenCalledWith(
        { trainerId: 'trainer-id' },
        expect.any(Object),
      );
      expect(actual.data).toHaveLength(1);
      expect(actual.meta).toBeDefined();
      const meta = actual.meta;
      if (!meta) {
        throw new Error('Expected pagination meta to be defined');
      }
      expect(meta.totalItems).toBe(1);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(20);
    });
  });

  describe('createMyTimeOff', () => {
    it('should throw BadRequestException when startTime >= endTime', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      await expect(
        service.createMyTimeOff(
          {
            reason: 'personal',
            startTime: '2026-02-01T10:00:00.000Z',
            endTime: '2026-02-01T09:00:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when duration is under 30 minutes', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      await expect(
        service.createMyTimeOff(
          {
            reason: 'personal',
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T09:15:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create time off when duration is exactly 30 minutes', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.create.mockResolvedValue({ id: 't1' });

      await service.createMyTimeOff(
        {
          reason: 'personal',
          startTime: '2026-02-01T09:00:00.000Z',
          endTime: '2026-02-01T09:30:00.000Z',
        },
        currentUser,
      );

      expect(timeOffRepository.create).toHaveBeenCalled();
      expect(scheduleConflictService.assertNoOverlap).toHaveBeenCalled();
    });

    it('should create time off for current user', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.create.mockResolvedValue({ id: 't1' });

      await service.createMyTimeOff(
        {
          reason: 'personal',
          startTime: '2026-02-01T09:00:00.000Z',
          endTime: '2026-02-01T10:00:00.000Z',
        },

        currentUser,
      );

      expect(timeOffRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'personal',
          trainer: { id: 'trainer-id' },
        }),
      );
    });
  });

  describe('updateMyTimeOff', () => {
    it('should throw BadRequestException when body is empty', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      await expect(
        service.updateMyTimeOff('t1', {}, currentUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when missing', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateMyTimeOff('missing', { reason: 'x' }, currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should update reason only', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'trainer-id' },
        reason: 'old',
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T10:00:00.000Z'),
      });
      timeOffRepository.save.mockResolvedValue(undefined);

      await service.updateMyTimeOff('t1', { reason: 'new' }, currentUser);

      expect(scheduleConflictService.assertNoOverlap).toHaveBeenCalledWith({
        trainerId: 'trainer-id',
        start: new Date('2026-02-01T09:00:00.000Z'),
        end: new Date('2026-02-01T10:00:00.000Z'),
        excludeTimeOffId: 't1',
      });
      expect(timeOffRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not owner', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'other' },
        reason: 'old',
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T10:00:00.000Z'),
      });

      await expect(
        service.updateMyTimeOff('t1', { reason: 'new' }, currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when updated window under 30 minutes', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'trainer-id' },
        reason: 'old',
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T10:00:00.000Z'),
      });

      await expect(
        service.updateMyTimeOff(
          't1',
          {
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T09:15:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteMyTimeOff', () => {
    it('should throw NotFoundException when missing', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteMyTimeOff('missing', currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should remove when owner', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'trainer-id' },
      });
      timeOffRepository.remove.mockResolvedValue(undefined);

      await service.deleteMyTimeOff('t1', currentUser);

      expect(timeOffRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not owner', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'other' },
      });

      await expect(
        service.deleteMyTimeOff('t1', currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('overlapping queries', () => {
    it('should forward getOverlappingTimeOffForTrainer', async () => {
      const expected = { id: 'o1' };
      timeOffRepository.findOverlappingForTrainer?.mockResolvedValue(expected);

      const actual = await service.getOverlappingTimeOffForTrainer(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );

      expect(timeOffRepository.findOverlappingForTrainer).toHaveBeenCalledWith(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );
      expect(actual).toBe(expected);
    });

    it('should forward getOverlappingTimeOffRangesForTrainer', async () => {
      timeOffRepository.findOverlappingRangesForTrainer?.mockResolvedValue([
        { id: 'o1' },
      ]);

      const actual = await service.getOverlappingTimeOffRangesForTrainer(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );

      expect(
        timeOffRepository.findOverlappingRangesForTrainer,
      ).toHaveBeenCalledWith(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );
      expect(actual).toHaveLength(1);
    });
  });
});
