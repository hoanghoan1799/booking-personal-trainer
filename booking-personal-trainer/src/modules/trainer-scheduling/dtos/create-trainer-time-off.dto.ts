import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength } from 'class-validator';

import { VALIDATION } from '../../../common/constants/validation.constant';

export class CreateTrainerTimeOffDto {
  @ApiProperty({ example: 'personal' })
  @IsString()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  reason: string;

  @ApiProperty({ example: '2026-02-01T09:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-02-01T10:00:00Z' })
  @IsDateString()
  endTime: string;
}
