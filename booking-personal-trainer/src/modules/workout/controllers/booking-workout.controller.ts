import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { UserRole } from '../../../common/enums/user/user.enum';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { Serialize } from '../../../common/decorators/serialize.decorator';

import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';
import { WorkoutService } from '../services/workout.service';
import { CreateBookingWorkoutDto } from '../dtos/create-booking-workout.dto';
import { WorkoutResponseDto } from '../dtos/workout-response.dto';
import { WorkoutSwagger } from '../constants/workout-swagger.constants';

@ApiTags('Booking workouts')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(WorkoutResponseDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings/:bookingId/workouts')
export class BookingWorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post()
  @Serialize(WorkoutResponseDto)
  @ApiOperation(WorkoutSwagger.Controller.BookingWorkout.ApiOperation.Create)
  @ApiParam(WorkoutSwagger.Controller.BookingWorkout.ApiParam.BookingId)
  @ApiBody(WorkoutSwagger.Controller.BookingWorkout.ApiBody.Create)
  @ApiResponse(
    WorkoutSwagger.Controller.BookingWorkout.ApiResponse.CreateCreated,
  )
  async create(
    @Param('bookingId') bookingId: string,
    @Body() body: CreateBookingWorkoutDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<WorkoutResponseDto>> {
    const workout = await this.workoutService.createForBookingFromTemplate(
      bookingId,
      body,
      currentUser,
    );
    return BaseResponseDto.ok(workout);
  }
}
