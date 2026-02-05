import { IsEnum, IsOptional, IsString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { BookingStatus } from '../../../common/enums/booking/booking.enum';

export class GetBookingsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  traineeId?: string;

  @IsOptional()
  @IsString()
  trainerId?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;
}
