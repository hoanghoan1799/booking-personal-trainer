import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Commons
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../constants/pagination.constant';

// Enums
import { SortOrder } from '../enums/pagination/pagination.enum';

export class BaseQueryDto {
  @IsOptional()
  @IsString()
  traineeId?: string;

  @IsOptional()
  @IsString()
  trainerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = DEFAULT_LIMIT;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
