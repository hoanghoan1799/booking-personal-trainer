import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

// Enums
import { TemplateType } from '../enums/template-type.enum';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Template type', enum: TemplateType })
  @IsEnum(TemplateType)
  @IsOptional()
  templateType?: TemplateType;

  @ApiPropertyOptional({ description: 'Parent template id', nullable: true })
  @IsUUID()
  @IsOptional()
  parentTemplateId?: string | null;
}
