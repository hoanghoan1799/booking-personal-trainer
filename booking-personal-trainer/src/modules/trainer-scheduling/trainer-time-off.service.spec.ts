import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { TrainerTimeOffService } from './trainer-time-off.service';
import { TrainerTimeOffRepositoryToken } from './repositories/trainer-time-off.repository.interface';

describe('TrainerTimeOffService', () => {
  let service: TrainerTimeOffService;
  let timeOffRepository: {
    findAndCount: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    timeOffRepository = {
      findAndCount: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerTimeOffService,
        {
          provide: TrainerTimeOffRepositoryToken,
          useValue: timeOffRepository,
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
});
