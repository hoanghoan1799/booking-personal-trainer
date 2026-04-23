import { Test, type TestingModule } from '@nestjs/testing';

import type { JwtAuthPayload } from '../../../auth/types/jwt-auth.type';
import { UserRole } from '../../../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../../../common/dtos/base-response.dto';

import { BookingWorkoutController } from '../booking-workout.controller';
import { WorkoutService } from '../../services/workout.service';

describe('BookingWorkoutController', () => {
  let controller: BookingWorkoutController;
  let workoutService: { createForBookingFromTemplate: jest.Mock };

  beforeEach(async () => {
    workoutService = { createForBookingFromTemplate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingWorkoutController],
      providers: [{ provide: WorkoutService, useValue: workoutService }],
    }).compile();

    controller = module.get<BookingWorkoutController>(BookingWorkoutController);
  });

  it('create should call service and wrap ok', async () => {
    workoutService.createForBookingFromTemplate.mockResolvedValue({ id: 'w1' });
    const currentUser: JwtAuthPayload = {
      id: 'trainer-id',
      email: 't@test.com',
      userName: 't',
      role: UserRole.TRAINER,
    };

    const actual = await controller.create(
      'booking-id',
      { templateId: 'template-id', amountCents: 1000, currency: 'USD' },
      currentUser,
    );

    expect(workoutService.createForBookingFromTemplate).toHaveBeenCalledWith(
      'booking-id',
      { templateId: 'template-id', amountCents: 1000, currency: 'USD' },
      currentUser,
    );
    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data).toEqual({ id: 'w1' });
  });
});
