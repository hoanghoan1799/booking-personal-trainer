import { IsEnum } from 'class-validator';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
