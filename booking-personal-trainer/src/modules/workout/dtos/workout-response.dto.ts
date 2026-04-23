import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// DTOs
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { ExerciseResponseDto } from '../../exercise/dto/exercise-response.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';
import { WorkoutDtoSwagger } from '../constants/workout-swagger-dto.constants';

export class WorkoutExerciseResponseDto {
  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.WorkoutExerciseId)
  @Expose()
  id: string;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Order)
  @Expose()
  order: number;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.Sets,
  )
  @Expose()
  sets?: number | null;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.Reps,
  )
  @Expose()
  reps?: number | null;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.RestSeconds,
  )
  @Expose()
  restSeconds?: number | null;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.Notes,
  )
  @Expose()
  notes?: string;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.IsCompleted)
  @Expose()
  isCompleted: boolean;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Exercise)
  @Expose()
  exercise: ExerciseResponseDto;
}

export class WorkoutResponseDto {
  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.BookingId,
  )
  @Expose()
  bookingId?: string | null;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.TemplateId,
  )
  @Expose()
  templateId?: string | null;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.StartTime)
  @Expose()
  startTime: Date;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.EndTime)
  @Expose()
  endTime: Date;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Status)
  @Expose()
  status: WorkoutStatus;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Trainer)
  @Expose()
  trainer: ResponseUserDto;

  @ApiProperty(WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Trainee)
  @Expose()
  trainee: ResponseUserDto;

  @ApiProperty(
    WorkoutDtoSwagger.WorkoutResponse.ApiProperty.Exercises(
      WorkoutExerciseResponseDto,
    ),
  )
  @Expose()
  @Type(() => WorkoutExerciseResponseDto)
  exercises: WorkoutExerciseResponseDto[];

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.TotalExercises,
  )
  @Expose()
  totalExercises?: number;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.CompletedExercises,
  )
  @Expose()
  completedExercises?: number;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.CreatedAt,
  )
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutResponse.ApiPropertyOptional.UpdatedAt,
  )
  @Expose()
  updatedAt?: Date;
}
