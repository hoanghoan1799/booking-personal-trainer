import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// DTOs
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { ExerciseResponseDto } from '../../exercise/dto/exercise-response.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class WorkoutExerciseResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.WORKOUT_EXERCISE_ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.ORDER,
  })
  @Expose()
  order: number;

  @ApiPropertyOptional({ description: 'Sets', nullable: true })
  @Expose()
  sets?: number | null;

  @ApiPropertyOptional({ description: 'Reps', nullable: true })
  @Expose()
  reps?: number | null;

  @ApiPropertyOptional({ description: 'Rest seconds', nullable: true })
  @Expose()
  restSeconds?: number | null;

  @ApiPropertyOptional({ description: 'Notes' })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.IS_COMPLETED,
  })
  @Expose()
  isCompleted: boolean;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.NAME,
    type: () => ExerciseResponseDto,
  })
  @Expose()
  exercise: ExerciseResponseDto;
}

export class WorkoutResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Booking id',
    format: API_FORMATS.UUID,
    nullable: true,
  })
  @Expose()
  bookingId?: string | null;

  @ApiPropertyOptional({
    description: 'Template id',
    format: API_FORMATS.UUID,
    nullable: true,
  })
  @Expose()
  templateId?: string | null;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.START_TIME,
    type: Date,
  })
  @Expose()
  startTime: Date;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.END_TIME,
    type: Date,
  })
  @Expose()
  endTime: Date;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.STATUS,
    enum: WorkoutStatus,
  })
  @Expose()
  status: WorkoutStatus;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.TRAINER,
    type: () => ResponseUserDto,
  })
  @Expose()
  trainer: ResponseUserDto;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.TRAINEE,
    type: () => ResponseUserDto,
  })
  @Expose()
  trainee: ResponseUserDto;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.EXERCISES,
    type: [WorkoutExerciseResponseDto],
  })
  @Expose()
  @Type(() => WorkoutExerciseResponseDto)
  exercises: WorkoutExerciseResponseDto[];

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.WORKOUT.TOTAL_EXERCISES,
  })
  @Expose()
  totalExercises?: number;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.WORKOUT.COMPLETED_EXERCISES,
  })
  @Expose()
  completedExercises?: number;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.WORKOUT.CREATED_AT,
  })
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.WORKOUT.UPDATED_AT,
  })
  @Expose()
  updatedAt?: Date;
}
