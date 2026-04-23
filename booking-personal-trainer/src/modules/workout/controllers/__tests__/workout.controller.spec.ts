import { Test, type TestingModule } from '@nestjs/testing';

import type { CurrentRequestUser } from '../../../../common/interfaces/request.interface';
import { UserRole } from '../../../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../../../common/dtos/base-response.dto';
import { WorkoutStatus } from '../../../../common/enums/workout/workout.enum';

import { WorkoutController } from '../workout.controller';
import { WorkoutService } from '../../services/workout.service';

describe('WorkoutController', () => {
  let controller: WorkoutController;
  let workoutService: {
    create: jest.Mock;
    getAll: jest.Mock;
    getOneForUser: jest.Mock;
    updateDetail: jest.Mock;
    removeAll: jest.Mock;
  };

  beforeEach(async () => {
    workoutService = {
      create: jest.fn(),
      getAll: jest.fn(),
      getOneForUser: jest.fn(),
      updateDetail: jest.fn(),
      removeAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutController],
      providers: [{ provide: WorkoutService, useValue: workoutService }],
    }).compile();

    controller = module.get<WorkoutController>(WorkoutController);
  });

  it('create should call service and wrap ok', async () => {
    workoutService.create.mockResolvedValue({ id: 'w1' });

    const actual = await controller.create(
      { id: 'trainer-id', role: UserRole.TRAINER } as never,
      {
        traineeId: 'trainee-id',
        startTime: '2026-01-01T10:00:00.000Z',
        endTime: '2026-01-01T11:00:00.000Z',
        exerciseIds: [],
        amountCents: 1000,
        currency: 'USD',
      },
    );

    expect(workoutService.create).toHaveBeenCalledWith(
      'trainer-id',
      expect.any(Object),
    );
    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data).toEqual({ id: 'w1' });
  });

  it('findAll should forward req user and query', async () => {
    const expected = BaseResponseDto.okWithPagination([], {
      totalItems: 0,
      page: 1,
      limit: 20,
    });
    workoutService.getAll.mockResolvedValue(expected);
    const req = {
      user: { id: 'u1', role: UserRole.TRAINEE },
    } as unknown as CurrentRequestUser;

    const actual = await controller.findAll({ page: 1, limit: 20 }, req);

    expect(workoutService.getAll).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      req.user,
    );
    expect(actual).toBe(expected);
  });

  it('findOne should call service and wrap ok', async () => {
    workoutService.getOneForUser.mockResolvedValue({ id: 'w1' });
    const req = {
      user: { id: 'u1', role: UserRole.TRAINEE },
    } as unknown as CurrentRequestUser;

    const actual = await controller.findOne('w1', req);

    expect(workoutService.getOneForUser).toHaveBeenCalledWith('w1', req.user);
    expect(actual.data).toEqual({ id: 'w1' });
  });

  it('update should call service and wrap ok', async () => {
    workoutService.updateDetail.mockResolvedValue({ id: 'w1' });
    const req = {
      user: { id: 'trainer-id', role: UserRole.TRAINER },
    } as unknown as CurrentRequestUser;

    const actual = await controller.update(
      'w1',
      { status: WorkoutStatus.PENDING },
      req,
    );

    expect(workoutService.updateDetail).toHaveBeenCalledWith(
      'w1',
      { status: WorkoutStatus.PENDING },
      req.user,
    );
    expect(actual.data).toEqual({ id: 'w1' });
  });

  it('remove should forward to removeAll', async () => {
    workoutService.removeAll.mockResolvedValue({
      message: 'Deleted 1 workouts',
    });

    const actual = await controller.remove();

    expect(workoutService.removeAll).toHaveBeenCalled();
    expect(actual).toEqual({ message: 'Deleted 1 workouts' });
  });
});
