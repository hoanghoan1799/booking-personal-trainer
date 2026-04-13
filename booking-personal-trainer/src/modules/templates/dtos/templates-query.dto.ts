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

export class TemplatesQueryDto {
  @ApiPropertyOptional({ description: 'Page (1-based)', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Limit', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by template type',
    enum: TemplateType,
  })
  @IsEnum(TemplateType)
  @IsOptional()
  templateType?: TemplateType;

  @ApiPropertyOptional({
    description: 'Filter by createdBy (admin only)',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional({
    description: 'Include deleted templates',
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
