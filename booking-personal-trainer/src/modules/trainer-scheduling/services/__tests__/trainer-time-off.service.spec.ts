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
  });
});
