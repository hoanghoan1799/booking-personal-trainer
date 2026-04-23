import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { WorkoutDtoSwagger } from '../constants/workout-swagger-dto.constants';

export class CreateWorkoutDto {
  @ApiProperty(WorkoutDtoSwagger.CreateWorkout.ApiProperty.TraineeId)
  @IsUUID()
  @IsNotEmpty()
  traineeId: string;

  @ApiProperty(WorkoutDtoSwagger.CreateWorkout.ApiProperty.ExerciseIds)
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  exerciseIds!: string[];

  @ApiPropertyOptional(
    WorkoutDtoSwagger.CreateWorkout.ApiPropertyOptional.AmountCents,
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.CreateWorkout.ApiPropertyOptional.Currency,
  )
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty(WorkoutDtoSwagger.CreateWorkout.ApiProperty.StartTime)
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty(WorkoutDtoSwagger.CreateWorkout.ApiProperty.EndTime)
  @IsNotEmpty()
  @IsDateString()
  endTime: string;
}
