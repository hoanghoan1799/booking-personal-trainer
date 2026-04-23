import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class CreateTemplateItemDto {
  @ApiProperty(TemplatesDtoSwagger.CreateTemplateItem.ApiProperty.ExerciseId)
  @IsUUID()
  exerciseId!: string;

  @ApiProperty(TemplatesDtoSwagger.CreateTemplateItem.ApiProperty.Order)
  @IsInt()
  @Min(1)
  order!: number;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.CreateTemplateItem.ApiPropertyOptional.Sets,
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  sets?: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.CreateTemplateItem.ApiPropertyOptional.Reps,
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  reps?: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.CreateTemplateItem.ApiPropertyOptional.RestSeconds,
  )
  @IsInt()
  @Min(0)
  @IsOptional()
  restSeconds?: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.CreateTemplateItem.ApiPropertyOptional.Notes,
  )
  @IsString()
  @IsOptional()
  notes?: string;
}
