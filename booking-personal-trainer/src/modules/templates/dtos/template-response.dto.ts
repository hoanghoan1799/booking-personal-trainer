import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Enums
import { TemplateType } from '../enums/template-type.enum';
import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class ExerciseTemplateItemResponseDto {
  @ApiProperty(TemplatesDtoSwagger.TemplateItemResponse.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(TemplatesDtoSwagger.TemplateItemResponse.ApiProperty.TemplateId)
  @Expose()
  templateId: string;

  @ApiProperty(TemplatesDtoSwagger.TemplateItemResponse.ApiProperty.ExerciseId)
  @Expose()
  exerciseId: string;

  @ApiProperty(TemplatesDtoSwagger.TemplateItemResponse.ApiProperty.Order)
  @Expose()
  order: number;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateItemResponse.ApiPropertyOptional.Sets,
  )
  @Expose()
  sets: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateItemResponse.ApiPropertyOptional.Reps,
  )
  @Expose()
  reps: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateItemResponse.ApiPropertyOptional.RestSeconds,
  )
  @Expose()
  restSeconds: number | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateItemResponse.ApiPropertyOptional.Notes,
  )
  @Expose()
  notes: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateItemResponse.ApiPropertyOptional.CreatedAtIso,
  )
  @Expose()
  createdAtIso: Date;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateItemResponse.ApiPropertyOptional.UpdatedAtIso,
  )
  @Expose()
  updatedAtIso: Date;
}

export class ExerciseTemplateResponseDto {
  @ApiProperty(TemplatesDtoSwagger.TemplateResponse.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(TemplatesDtoSwagger.TemplateResponse.ApiProperty.Name)
  @Expose()
  name: string;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateResponse.ApiPropertyOptional.Description,
  )
  @Expose()
  description: string;

  @ApiProperty(TemplatesDtoSwagger.TemplateResponse.ApiProperty.CreatedBy)
  @Expose()
  createdBy: string;

  @ApiProperty(TemplatesDtoSwagger.TemplateResponse.ApiProperty.TemplateType)
  @Expose()
  templateType: TemplateType;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateResponse.ApiPropertyOptional.ParentTemplateId,
  )
  @Expose()
  parentTemplateId: string | null;

  @ApiProperty(TemplatesDtoSwagger.TemplateResponse.ApiProperty.IsDeleted)
  @Expose()
  isDeleted: boolean;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateResponse.ApiPropertyOptional.DeletedAtIso,
  )
  @Expose()
  deletedAtIso: string | null;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateResponse.ApiPropertyOptional.CreatedAtIso,
  )
  @Expose()
  createdAtIso: Date;

  @ApiPropertyOptional(
    TemplatesDtoSwagger.TemplateResponse.ApiPropertyOptional.UpdatedAtIso,
  )
  @Expose()
  updatedAtIso: Date;

  @ApiProperty(
    TemplatesDtoSwagger.TemplateResponse.ApiProperty.Items(
      ExerciseTemplateItemResponseDto,
    ),
  )
  @Expose()
  @Type(() => ExerciseTemplateItemResponseDto)
  items: ExerciseTemplateItemResponseDto[];
}
