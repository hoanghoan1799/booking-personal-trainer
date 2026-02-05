import { IsEnum, IsOptional } from 'class-validator';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';

export class GetBookingsQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
