import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateTemplateItemDto {
  @ApiPropertyOptional({ description: 'Exercise id', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  exerciseId?: string;

  @ApiPropertyOptional({ description: 'Order (1-based)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Sets', nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  sets?: number | null;

  @ApiPropertyOptional({ description: 'Reps', nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  reps?: number | null;

  @ApiPropertyOptional({ description: 'Rest seconds', nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  restSeconds?: number | null;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
