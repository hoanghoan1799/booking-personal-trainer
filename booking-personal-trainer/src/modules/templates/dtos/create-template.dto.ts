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

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Template type', enum: TemplateType })
  @IsEnum(TemplateType)
  templateType!: TemplateType;

  @ApiPropertyOptional({ description: 'Parent template id', nullable: true })
  @IsUUID()
  @IsOptional()
  parentTemplateId?: string | null;
}
