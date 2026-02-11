import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Commons
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../constants/pagination.constant';
import { API_FORMATS, FIELD_DESCRIPTIONS } from '../constants/message.constant';

// Enums
import { SortOrder } from '../enums/pagination/pagination.enum';

export class BaseQueryDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.TRAINEE_ID_FILTER,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @IsOptional()
  @IsString()
  traineeId?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.TRAINER_ID_FILTER,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @IsOptional()
  @IsString()
  trainerId?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.PAGE,
    default: DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.LIMIT,
    default: DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.ORDER,
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
