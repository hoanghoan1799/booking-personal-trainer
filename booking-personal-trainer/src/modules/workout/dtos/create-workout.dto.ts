import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class CreateWorkoutDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.TRAINEE_ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @IsUUID()
  @IsNotEmpty()
  traineeId: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.EXERCISE_IDS,
    type: [String],
    format: API_FORMATS.UUID,
    example: [FIELD_DESCRIPTIONS.USER.ID_EXAMPLE],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  exerciseIds!: string[];

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.START_TIME,
    format: API_FORMATS.DATE_TIME,
    example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_START_EXAMPLE,
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.END_TIME,
    format: API_FORMATS.DATE_TIME,
    example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_END_EXAMPLE,
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;
}
