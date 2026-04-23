import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

// Enums
import { TemplateType } from '../enums/template-type.enum';
import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class UpdateTemplateDto {
  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplate.ApiPropertyOptional.Name,
  )
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplate.ApiPropertyOptional.Description,
  )
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplate.ApiPropertyOptional.TemplateType,
  )
  @IsEnum(TemplateType)
  @IsOptional()
  templateType?: TemplateType;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.UpdateTemplate.ApiPropertyOptional.ParentTemplateId,
  )
  @IsUUID()
  @IsOptional()
  parentTemplateId?: string | null;
}
