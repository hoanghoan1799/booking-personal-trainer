import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

import { VALIDATION } from '../../../common/constants/validation.constant';

export class UpdateTrainerTimeOffDto {
  @ApiPropertyOptional({ example: 'personal' })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  reason?: string;

  @ApiPropertyOptional({ example: '2026-02-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-02-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
