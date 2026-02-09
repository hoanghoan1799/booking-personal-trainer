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
  ParseUUIDPipe,
} from '@nestjs/common';

// Commons
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BaseResponse } from '../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// DTOs
import { ExercisesQueryDto } from './dto/query-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

// Services
import { ExerciseService } from './exercise.service';
import { ExerciseResponseDto } from './dto/exercise-response.dto';

// Decorators
import { Serialize } from '../../common/decorators/serialize.decorator';
import { SuccessMessageResponse } from 'src/common/interfaces/success-message-response.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @Serialize(ExerciseResponseDto)
  create(
    @Body() body: CreateExerciseDto,
  ): Promise<BaseResponse<ExerciseResponseDto>> {
    return this.exerciseService.create(body);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  @Serialize(ExerciseResponseDto)
  getAll(@Query() query: ExercisesQueryDto) {
    return this.exerciseService.getAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get(':id')
  @Serialize(ExerciseResponseDto)
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponse<ExerciseResponseDto>> {
    return this.exerciseService.getOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @Serialize(ExerciseResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateExerciseDto,
  ): Promise<BaseResponse<ExerciseResponseDto>> {
    return this.exerciseService.update(id, body);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string): Promise<SuccessMessageResponse> {
    return this.exerciseService.restore(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessMessageResponse> {
    return this.exerciseService.softDelete(id);
  }
}
