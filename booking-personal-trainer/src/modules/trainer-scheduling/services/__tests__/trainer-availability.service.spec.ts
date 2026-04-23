import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TrainerAvailabilityService } from '../trainer-availability.service';
import { TrainerAvailabilityRepositoryToken } from '../../repositories/trainer-availability.repository.interface';
import { TrainerScheduleConflictService } from '../trainer-schedule-conflict.service';
import type { User } from '../../../user/entities/user.entity';

describe('TrainerAvailabilityService', () => {
  let service: TrainerAvailabilityService;
  let availabilityRepository: {
    findAndCount: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    findCoveringForTrainer?: jest.Mock;
    findCoveringRanges?: jest.Mock;
    findOverlappingRangesForTrainer?: jest.Mock;
  };
  let scheduleConflictService: {
    assertNoOverlap: jest.Mock;
  };

  beforeEach(async () => {
    availabilityRepository = {
      findAndCount: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findCoveringForTrainer: jest.fn(),
      findCoveringRanges: jest.fn(),
      findOverlappingRangesForTrainer: jest.fn(),
    };
    scheduleConflictService = {
      assertNoOverlap: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerAvailabilityService,
        {
          provide: TrainerAvailabilityRepositoryToken,
          useValue: availabilityRepository,
        },
        {
          provide: TrainerScheduleConflictService,
          useValue: scheduleConflictService,
        },
      ],
    }).compile();

    service = module.get<TrainerAvailabilityService>(
      TrainerAvailabilityService,
    );
  });

  describe('getMyAvailabilities', () => {
    it('should return paginated response', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findAndCount.mockResolvedValue([
        [{ id: 'a1' }],
        1,
      ]);

      const actual = await service.getMyAvailabilities(currentUser);

      expect(availabilityRepository.findAndCount).toHaveBeenCalledWith(
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

  describe('createMyAvailability', () => {
    it('should throw BadRequestException when startTime >= endTime', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      await expect(
        service.createMyAvailability(
          {
            dayOfWeek: 1,
            startTime: '2026-02-01T10:00:00.000Z',
            endTime: '2026-02-01T09:00:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when duration is under 1 hour', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      await expect(
        service.createMyAvailability(
          {
            dayOfWeek: 1,
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T09:30:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create availability for current user', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.create.mockResolvedValue({ id: 'a1' });

      await service.createMyAvailability(
        {
          dayOfWeek: 1,
          startTime: '2026-02-01T09:00:00.000Z',
          endTime: '2026-02-01T10:00:00.000Z',
        },
        currentUser,
      );

      expect(availabilityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dayOfWeek: 1,
          trainer: { id: 'trainer-id' },
        }),
      );
      expect(scheduleConflictService.assertNoOverlap).toHaveBeenCalledWith({
        trainerId: 'trainer-id',
        start: new Date('2026-02-01T09:00:00.000Z'),
        end: new Date('2026-02-01T10:00:00.000Z'),
      });
    });

    it('should throw when schedule conflict service rejects', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      scheduleConflictService.assertNoOverlap.mockRejectedValue(
        new BadRequestException('overlap'),
      );

      await expect(
        service.createMyAvailability(
          {
            dayOfWeek: 1,
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T10:00:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(availabilityRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateMyAvailability', () => {
    it('should throw NotFoundException when missing', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateMyAvailability(
          'missing',
          { startTime: '2026-02-01T09:00:00.000Z' },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when not owner', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue({
        id: 'a1',
        trainer: { id: 'other' },
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T10:00:00.000Z'),
      });

      await expect(
        service.updateMyAvailability(
          'a1',
          { startTime: '2026-02-01T09:00:00.000Z' },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when updated window is under 1 hour', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue({
        id: 'a1',
        trainer: { id: 'trainer-id' },
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T11:00:00.000Z'),
      });

      await expect(
        service.updateMyAvailability(
          'a1',
          {
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T09:45:00.000Z',
          },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should call assertNoOverlap before save when valid', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue({
        id: 'a1',
        trainer: { id: 'trainer-id' },
        startTime: new Date('2026-02-01T09:00:00.000Z'),
        endTime: new Date('2026-02-01T11:00:00.000Z'),
      });
      availabilityRepository.save.mockResolvedValue(undefined);

      await service.updateMyAvailability(
        'a1',
        {
          startTime: '2026-02-01T10:00:00.000Z',
          endTime: '2026-02-01T12:00:00.000Z',
        },
        currentUser,
      );

      expect(scheduleConflictService.assertNoOverlap).toHaveBeenCalledWith({
        trainerId: 'trainer-id',
        start: new Date('2026-02-01T10:00:00.000Z'),
        end: new Date('2026-02-01T12:00:00.000Z'),
        excludeAvailabilityId: 'a1',
      });
      expect(availabilityRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteMyAvailability', () => {
    it('should throw NotFoundException when missing', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteMyAvailability('missing', currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when not owner', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue({
        id: 'a1',
        trainer: { id: 'other' },
      });

      await expect(
        service.deleteMyAvailability('a1', currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should remove when owner', async () => {
      const currentUser = { id: 'trainer-id' } as unknown as User;
      availabilityRepository.findById.mockResolvedValue({
        id: 'a1',
        trainer: { id: 'trainer-id' },
      });
      availabilityRepository.remove.mockResolvedValue(undefined);

      await service.deleteMyAvailability('a1', currentUser);

      expect(availabilityRepository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a1' }),
      );
    });
  });

  describe('covering/overlapping queries', () => {
    it('should forward getCoveringAvailabilityForTrainer', async () => {
      const expected = { id: 'a1' };
      availabilityRepository.findCoveringForTrainer?.mockResolvedValue(
        expected,
      );

      const actual = await service.getCoveringAvailabilityForTrainer(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );

      expect(
        availabilityRepository.findCoveringForTrainer,
      ).toHaveBeenCalledWith(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );
      expect(actual).toBe(expected);
    });

    it('should forward getCoveringAvailabilitiesForRange', async () => {
      availabilityRepository.findCoveringRanges?.mockResolvedValue([
        { id: 'a1' },
      ]);

      const actual = await service.getCoveringAvailabilitiesForRange(
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );

      expect(availabilityRepository.findCoveringRanges).toHaveBeenCalledWith(
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );
      expect(actual).toHaveLength(1);
    });

    it('should forward getOverlappingAvailabilityRangesForTrainer', async () => {
      availabilityRepository.findOverlappingRangesForTrainer?.mockResolvedValue(
        [{ id: 'a1' }],
      );

      const actual = await service.getOverlappingAvailabilityRangesForTrainer(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );

      expect(
        availabilityRepository.findOverlappingRangesForTrainer,
      ).toHaveBeenCalledWith(
        'trainer-id',
        new Date('2026-02-01T09:00:00.000Z'),
        new Date('2026-02-01T10:00:00.000Z'),
      );
      expect(actual).toHaveLength(1);
    });
  });
});
