import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TrainerAvailabilityService } from './trainer-availability.service';
import { TrainerAvailabilityRepositoryToken } from './repositories/trainer-availability.repository.interface';

describe('TrainerAvailabilityService', () => {
  let service: TrainerAvailabilityService;
  let availabilityRepository: {
    findAndCount: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    availabilityRepository = {
      findAndCount: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerAvailabilityService,
        {
          provide: TrainerAvailabilityRepositoryToken,
          useValue: availabilityRepository,
        },
      ],
    }).compile();

    service = module.get<TrainerAvailabilityService>(
      TrainerAvailabilityService,
    );
  });

  describe('createMyAvailability', () => {
    it('should throw BadRequestException when startTime >= endTime', async () => {
      await expect(
        service.createMyAvailability(
          {
            dayOfWeek: 1,
            startTime: '2026-02-01T10:00:00.000Z',
            endTime: '2026-02-01T09:00:00.000Z',
          },
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when duration is under 1 hour', async () => {
      await expect(
        service.createMyAvailability(
          {
            dayOfWeek: 1,
            startTime: '2026-02-01T09:00:00.000Z',
            endTime: '2026-02-01T09:30:00.000Z',
          },
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create availability for current user', async () => {
      availabilityRepository.create.mockResolvedValue({ id: 'a1' });

      await service.createMyAvailability(
        {
          dayOfWeek: 1,
          startTime: '2026-02-01T09:00:00.000Z',
          endTime: '2026-02-01T10:00:00.000Z',
        },
        { id: 'trainer-id' } as any,
      );

      expect(availabilityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dayOfWeek: 1,
          trainer: { id: 'trainer-id' },
        }),
      );
    });
  });

  describe('updateMyAvailability', () => {
    it('should throw NotFoundException when missing', async () => {
      availabilityRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateMyAvailability(
          'missing',
          { startTime: '2026-02-01T09:00:00.000Z' },
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when not owner', async () => {
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
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when updated window is under 1 hour', async () => {
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
          { id: 'trainer-id' } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
