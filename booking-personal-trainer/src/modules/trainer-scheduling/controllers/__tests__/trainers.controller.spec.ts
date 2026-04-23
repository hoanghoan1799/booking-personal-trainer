import { Test, type TestingModule } from '@nestjs/testing';

import { BaseResponseDto } from '../../../../common/dtos/base-response.dto';
import type { CurrentRequestUser } from '../../../../common/interfaces/request.interface';
import { TrainersController } from '../trainers.controller';
import { TrainerAvailabilityService } from '../../services/trainer-availability.service';
import { TrainerTimeOffService } from '../../services/trainer-time-off.service';

describe('TrainersController', () => {
  let controller: TrainersController;
  let trainerAvailabilityService: {
    getMyAvailabilities: jest.Mock;
    createMyAvailability: jest.Mock;
    updateMyAvailability: jest.Mock;
    deleteMyAvailability: jest.Mock;
  };
  let trainerTimeOffService: {
    getMyTimeOff: jest.Mock;
    createMyTimeOff: jest.Mock;
    updateMyTimeOff: jest.Mock;
    deleteMyTimeOff: jest.Mock;
  };

  beforeEach(async () => {
    trainerAvailabilityService = {
      getMyAvailabilities: jest.fn(),
      createMyAvailability: jest.fn(),
      updateMyAvailability: jest.fn(),
      deleteMyAvailability: jest.fn(),
    };
    trainerTimeOffService = {
      getMyTimeOff: jest.fn(),
      createMyTimeOff: jest.fn(),
      updateMyTimeOff: jest.fn(),
      deleteMyTimeOff: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainersController],
      providers: [
        {
          provide: TrainerAvailabilityService,
          useValue: trainerAvailabilityService,
        },
        {
          provide: TrainerTimeOffService,
          useValue: trainerTimeOffService,
        },
      ],
    }).compile();

    controller = module.get<TrainersController>(TrainersController);
  });

  it('getMyAvailabilities should forward request user', async () => {
    const expected = BaseResponseDto.okWithPagination([], {
      totalItems: 0,
      page: 1,
      limit: 10,
    });
    trainerAvailabilityService.getMyAvailabilities.mockResolvedValue(expected);
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.getMyAvailabilities(req);

    expect(trainerAvailabilityService.getMyAvailabilities).toHaveBeenCalledWith(
      req.user,
    );
    expect(actual).toBe(expected);
  });

  it('createMyAvailability should wrap created in ok response', async () => {
    trainerAvailabilityService.createMyAvailability.mockResolvedValue({
      id: 'a1',
    });
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.createMyAvailability(
      {
        dayOfWeek: 1,
        startTime: '2026-02-01T09:00:00.000Z',
        endTime: '2026-02-01T10:00:00.000Z',
      },
      req,
    );

    expect(trainerAvailabilityService.createMyAvailability).toHaveBeenCalled();
    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data).toEqual({ id: 'a1' });
  });

  it('updateMyAvailability should wrap updated in ok response', async () => {
    trainerAvailabilityService.updateMyAvailability.mockResolvedValue({
      id: 'a1',
    });
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.updateMyAvailability(
      'a1',
      { startTime: '2026-02-01T09:00:00.000Z' },
      req,
    );

    expect(
      trainerAvailabilityService.updateMyAvailability,
    ).toHaveBeenCalledWith(
      'a1',
      { startTime: '2026-02-01T09:00:00.000Z' },
      req.user,
    );
    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data).toEqual({ id: 'a1' });
  });

  it('deleteMyAvailability should call service and return void', async () => {
    trainerAvailabilityService.deleteMyAvailability.mockResolvedValue(
      undefined,
    );
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.deleteMyAvailability('a1', req);

    expect(
      trainerAvailabilityService.deleteMyAvailability,
    ).toHaveBeenCalledWith('a1', req.user);
    expect(actual).toBeUndefined();
  });

  it('getMyTimeOff should forward request user', async () => {
    const expected = BaseResponseDto.okWithPagination([], {
      totalItems: 0,
      page: 1,
      limit: 10,
    });
    trainerTimeOffService.getMyTimeOff.mockResolvedValue(expected);
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.getMyTimeOff(req);

    expect(trainerTimeOffService.getMyTimeOff).toHaveBeenCalledWith(req.user);
    expect(actual).toBe(expected);
  });

  it('createMyTimeOff should wrap created in ok response', async () => {
    trainerTimeOffService.createMyTimeOff.mockResolvedValue({ id: 'o1' });
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.createMyTimeOff(
      {
        reason: 'personal',
        startTime: '2026-02-01T09:00:00.000Z',
        endTime: '2026-02-01T09:30:00.000Z',
      },
      req,
    );

    expect(trainerTimeOffService.createMyTimeOff).toHaveBeenCalled();
    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data).toEqual({ id: 'o1' });
  });

  it('updateMyTimeOff should wrap updated in ok response', async () => {
    trainerTimeOffService.updateMyTimeOff.mockResolvedValue({ id: 'o1' });
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.updateMyTimeOff(
      'o1',
      { reason: 'new' },
      req,
    );

    expect(trainerTimeOffService.updateMyTimeOff).toHaveBeenCalledWith(
      'o1',
      { reason: 'new' },
      req.user,
    );
    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data).toEqual({ id: 'o1' });
  });

  it('deleteMyTimeOff should call service and return void', async () => {
    trainerTimeOffService.deleteMyTimeOff.mockResolvedValue(undefined);
    const req = { user: { id: 'trainer-id' } } as unknown as CurrentRequestUser;

    const actual = await controller.deleteMyTimeOff('o1', req);

    expect(trainerTimeOffService.deleteMyTimeOff).toHaveBeenCalledWith(
      'o1',
      req.user,
    );
    expect(actual).toBeUndefined();
  });
});
