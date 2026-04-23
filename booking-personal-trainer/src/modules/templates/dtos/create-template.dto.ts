import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// Enums
import { TemplateType } from '../enums/template-type.enum';
import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class CreateTemplateDto {
  @ApiProperty(TemplatesDtoSwagger.CreateTemplate.ApiProperty.Name)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.CreateTemplate.ApiPropertyOptional.Description,
  )
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty(TemplatesDtoSwagger.CreateTemplate.ApiProperty.TemplateType)
  @IsEnum(TemplateType)
  templateType!: TemplateType;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.CreateTemplate.ApiPropertyOptional.ParentTemplateId,
  )
  @IsUUID()
  @IsOptional()
  parentTemplateId?: string | null;
}
