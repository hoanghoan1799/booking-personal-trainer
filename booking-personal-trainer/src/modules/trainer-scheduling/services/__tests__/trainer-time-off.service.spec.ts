/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TrainerTimeOffService } from '../../services/trainer-time-off.service';
import { TrainerTimeOffRepositoryToken } from '../../repositories/trainer-time-off.repository.interface';
import { TrainerScheduleConflictService } from '../../services/trainer-schedule-conflict.service';

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
      await expect(
        service.createMyTimeOff(
          {
            reason: 'personal',
            startTime: '2026-02-01T10:00:00.000Z',
            endTime: '2026-02-01T09:00:00.000Z',
          },
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when duration is under 30 minutes', async () => {
      await expect(
        service.createMyTimeOff(
          {
            reason: 'personal',
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T09:15:00.000Z',
          },
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create time off when duration is exactly 30 minutes', async () => {
      timeOffRepository.create.mockResolvedValue({ id: 't1' });

      await service.createMyTimeOff(
        {
          reason: 'personal',
          startTime: '2026-02-01T09:00:00.000Z',
          endTime: '2026-02-01T09:30:00.000Z',
        },
        { id: 'trainer-id' } as any,
      );

      expect(timeOffRepository.create).toHaveBeenCalled();
      expect(scheduleConflictService.assertNoOverlap).toHaveBeenCalled();
    });

    it('should create time off for current user', async () => {
      timeOffRepository.create.mockResolvedValue({ id: 't1' });

      await service.createMyTimeOff(
        {
          reason: 'personal',
          startTime: '2026-02-01T09:00:00.000Z',
          endTime: '2026-02-01T10:00:00.000Z',
        },

        { id: 'trainer-id' } as any,
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
      await expect(
        service.updateMyTimeOff('t1', {}, { id: 'trainer-id' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when missing', async () => {
      timeOffRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateMyTimeOff('missing', { reason: 'x' }, {
          id: 'trainer-id',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should update reason only', async () => {
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'trainer-id' },
        reason: 'old',
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T10:00:00.000Z'),
      });
      timeOffRepository.save.mockResolvedValue(undefined);

      await service.updateMyTimeOff('t1', { reason: 'new' }, {
        id: 'trainer-id',
      } as any);

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
      timeOffRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteMyTimeOff('missing', { id: 'trainer-id' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should remove when owner', async () => {
      timeOffRepository.findById.mockResolvedValue({
        id: 't1',
        trainer: { id: 'trainer-id' },
      });
      timeOffRepository.remove.mockResolvedValue(undefined);

      await service.deleteMyTimeOff('t1', { id: 'trainer-id' } as any);

      expect(timeOffRepository.remove).toHaveBeenCalled();
    });
  });
});
