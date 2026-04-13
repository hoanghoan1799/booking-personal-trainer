import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ImportTemplatesCsvResponseDto {
  @ApiProperty({ description: 'Total CSV rows processed (excluding header)' })
  @Expose()
  totalRows: number;

  @ApiProperty({ description: 'Created templates count' })
  @Expose()
  createdTemplates: number;

  @ApiProperty({ description: 'Created template items count' })
  @Expose()
  createdItems: number;

  @ApiProperty({ description: 'Created template ids', type: [String] })
  @Expose()
  createdTemplateIds: string[];
}
