import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { TemplatesDtoSwagger } from '../constants/templates-swagger-dto.constants';

export class ImportTemplatesCsvResponseDto {
  @ApiProperty(
    TemplatesDtoSwagger.ImportTemplatesCsvResponse.ApiProperty.TotalRows,
  )
  @Expose()
  totalRows: number;

  @ApiProperty(
    TemplatesDtoSwagger.ImportTemplatesCsvResponse.ApiProperty.CreatedTemplates,
  )
  @Expose()
  createdTemplates: number;

  @ApiProperty(
    TemplatesDtoSwagger.ImportTemplatesCsvResponse.ApiProperty.CreatedItems,
  )
  @Expose()
  createdItems: number;

  @ApiProperty(
    TemplatesDtoSwagger.ImportTemplatesCsvResponse.ApiProperty
      .CreatedTemplateIds,
  )
  @Expose()
  createdTemplateIds: string[];
}
