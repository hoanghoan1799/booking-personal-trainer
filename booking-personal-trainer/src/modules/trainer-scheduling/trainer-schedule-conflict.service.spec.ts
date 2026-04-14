import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { TrainerAvailabilityRepositoryToken } from './repositories/trainer-availability.repository.interface';
import { TrainerTimeOffRepositoryToken } from './repositories/trainer-time-off.repository.interface';
import { TrainerScheduleConflictService } from './trainer-schedule-conflict.service';

describe('TrainerScheduleConflictService', () => {
  let service: TrainerScheduleConflictService;
  let availabilityRepository: {
    findOverlappingForTrainer: jest.Mock;
  };
  let timeOffRepository: {
    findOverlappingForTrainer: jest.Mock;
  };

  beforeEach(async () => {
    availabilityRepository = {
      findOverlappingForTrainer: jest.fn(),
    };
    timeOffRepository = {
      findOverlappingForTrainer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerScheduleConflictService,
        {
          provide: TrainerAvailabilityRepositoryToken,
          useValue: availabilityRepository,
        },
        {
          provide: TrainerTimeOffRepositoryToken,
          useValue: timeOffRepository,
        },
      ],
    }).compile();

    service = module.get<TrainerScheduleConflictService>(
      TrainerScheduleConflictService,
    );
  });

  it('should throw when an overlapping availability exists', async () => {
    availabilityRepository.findOverlappingForTrainer.mockResolvedValue({
      id: 'a1',
    });

    await expect(
      service.assertNoOverlap({
        trainerId: 't1',
        start: new Date('2026-02-01T09:00:00.000Z'),
        end: new Date('2026-02-01T11:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(timeOffRepository.findOverlappingForTrainer).not.toHaveBeenCalled();
  });

  it('should throw when an overlapping time off exists', async () => {
    availabilityRepository.findOverlappingForTrainer.mockResolvedValue(null);
    timeOffRepository.findOverlappingForTrainer.mockResolvedValue({ id: 'o1' });

    await expect(
      service.assertNoOverlap({
        trainerId: 't1',
        start: new Date('2026-02-01T09:00:00.000Z'),
        end: new Date('2026-02-01T11:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should pass when no overlaps and forward exclusions to repos', async () => {
    availabilityRepository.findOverlappingForTrainer.mockResolvedValue(null);
    timeOffRepository.findOverlappingForTrainer.mockResolvedValue(null);

    await service.assertNoOverlap({
      trainerId: 't1',
      start: new Date('2026-02-01T09:00:00.000Z'),
      end: new Date('2026-02-01T11:00:00.000Z'),
      excludeAvailabilityId: 'a-x',
      excludeTimeOffId: 'o-x',
    });

    expect(
      availabilityRepository.findOverlappingForTrainer,
    ).toHaveBeenCalledWith(
      't1',
      new Date('2026-02-01T09:00:00.000Z'),
      new Date('2026-02-01T11:00:00.000Z'),
      'a-x',
    );
    expect(timeOffRepository.findOverlappingForTrainer).toHaveBeenCalledWith(
      't1',
      new Date('2026-02-01T09:00:00.000Z'),
      new Date('2026-02-01T11:00:00.000Z'),
      'o-x',
    );
  });
});
