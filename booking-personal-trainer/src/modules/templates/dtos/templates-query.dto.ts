import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

// Enums
import { TemplateType } from '../enums/template-type.enum';
import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class TemplatesQueryDto {
  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplatesQuery.ApiPropertyOptional.Page,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplatesQuery.ApiPropertyOptional.Limit,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplatesQuery.ApiPropertyOptional.TemplateType,
  )
  @IsEnum(TemplateType)
  @IsOptional()
  templateType?: TemplateType;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplatesQuery.ApiPropertyOptional.CreatedById,
  )
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplatesQuery.ApiPropertyOptional.IncludeDeleted,
  )
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
