import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';

// Commons
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

import { ExercisesQueryDto } from './dto/query-exercise.dto';

// Services
import { ExerciseService } from './exercise.service';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// DTOs
import { CreateExerciseDto } from './dto/create-exercise.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: CreateExerciseDto) {
    return this.exerciseService.create(body);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  getAll(@Query() query: ExercisesQueryDto) {
    return this.exerciseService.getAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.exerciseService.getOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    // @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exerciseService.update(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exerciseService.remove(id);
  }
}
