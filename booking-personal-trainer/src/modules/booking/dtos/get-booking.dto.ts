import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

export class GetBookingsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.BOOKING_STATUS_FILTER,
    enum: BookingStatus,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
