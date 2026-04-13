import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Enums
import { TemplateType } from '../enums/template-type.enum';

export class ExerciseTemplateItemResponseDto {
  @ApiProperty({ description: 'Template item id', format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Template id', format: 'uuid' })
  @Expose()
  templateId: string;

  @ApiProperty({ description: 'Exercise id', format: 'uuid' })
  @Expose()
  exerciseId: string;

  @ApiProperty({ description: 'Order' })
  @Expose()
  order: number;

  @ApiPropertyOptional({ description: 'Sets', nullable: true })
  @Expose()
  sets: number | null;

  @ApiPropertyOptional({ description: 'Reps', nullable: true })
  @Expose()
  reps: number | null;

  @ApiPropertyOptional({ description: 'Rest seconds', nullable: true })
  @Expose()
  restSeconds: number | null;

  @ApiPropertyOptional({ description: 'Notes' })
  @Expose()
  notes: string;

  @ApiPropertyOptional({ description: 'Created at (ISO)' })
  @Expose()
  createdAtIso: Date;

  @ApiPropertyOptional({ description: 'Updated at (ISO)' })
  @Expose()
  updatedAtIso: Date;
}

export class ExerciseTemplateResponseDto {
  @ApiProperty({ description: 'Template id', format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Template name' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Created by user id', format: 'uuid' })
  @Expose()
  createdBy: string;

  @ApiProperty({ description: 'Template type', enum: TemplateType })
  @Expose()
  templateType: TemplateType;

  @ApiPropertyOptional({ description: 'Parent template id', nullable: true })
  @Expose()
  parentTemplateId: string | null;

  @ApiProperty({ description: 'Is deleted' })
  @Expose()
  isDeleted: boolean;

  @ApiPropertyOptional({ description: 'Deleted at (ISO)', nullable: true })
  @Expose()
  deletedAtIso: string | null;

  @ApiPropertyOptional({ description: 'Created at (ISO)' })
  @Expose()
  createdAtIso: Date;

  @ApiPropertyOptional({ description: 'Updated at (ISO)' })
  @Expose()
  updatedAtIso: Date;

  @ApiProperty({
    description: 'Items',
    type: [ExerciseTemplateItemResponseDto],
  })
  @Expose()
  @Type(() => ExerciseTemplateItemResponseDto)
  items: ExerciseTemplateItemResponseDto[];
}
