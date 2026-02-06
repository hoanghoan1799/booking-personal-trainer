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

// Entities
import { User } from '../user/entities/user.entity';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';

// Services
import { WorkoutService } from './workout.service';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkoutsQueryDto } from './dtos/query-workout.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workouts')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post()
  create(@CurrentUser() trainer: User, @Body() body: CreateWorkoutDto) {
    return this.workoutService.create(trainer.id, body);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  findAll(@Query() query: WorkoutsQueryDto) {
    return this.workoutService.getAll(query);
  }
  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workoutService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workoutService.remove(id);
  }
}
