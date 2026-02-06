import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateWorkoutDto {
  @IsUUID()
  @IsNotEmpty()
  traineeId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  exerciseIds!: string[];

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;
}
