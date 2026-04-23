import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class UpdateTemplateItemDto {
  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplateItem.ApiPropertyOptional.ExerciseId,
  )
  @IsUUID()
  @IsOptional()
  exerciseId?: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplateItem.ApiPropertyOptional.Order,
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplateItem.ApiPropertyOptional.Sets,
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  sets?: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplateItem.ApiPropertyOptional.Reps,
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  reps?: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplateItem.ApiPropertyOptional.RestSeconds,
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  restSeconds?: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplateItem.ApiPropertyOptional.Notes,
  )
  @IsString()
  @IsOptional()
  notes?: string;
}
