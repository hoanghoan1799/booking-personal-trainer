import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.STATUS,
    enum: BookingStatus,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
