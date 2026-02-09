import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';

// Commons
import { CurrentUser } from '../../common/decorators/user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuccessMessageResponse } from '../../common/interfaces/success-message-response.interface';

// Entities
import { User } from '../user/entities/user.entity';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { WorkoutsQueryDto } from './dtos/query-workout.dto';
import { WorkoutResponseDto } from './dtos/workout-response.dto';

// Services
import { WorkoutService } from './workout.service';

// Decorators
import { Serialize } from '../../common/decorators/serialize.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workouts')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post()
  @Serialize(WorkoutResponseDto)
  async create(
    @CurrentUser() trainer: User,
    @Body() body: CreateWorkoutDto,
  ): Promise<BaseResponseDto<WorkoutResponseDto>> {
    const workout = await this.workoutService.create(trainer.id, body);

    return BaseResponseDto.ok(workout);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  @Serialize(WorkoutResponseDto)
  findAll(
    @Query() query: WorkoutsQueryDto,
  ): Promise<BaseResponseDto<WorkoutResponseDto[]>> {
    return this.workoutService.getAll(query);
  }
  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workoutService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Delete(':id')
  remove(): Promise<SuccessMessageResponse> {
    return this.workoutService.removeAll();
  }
}
