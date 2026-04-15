import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Cancellation reason (required when status=CANCELLED)',
  })
  @IsString()
  @MinLength(3)
  @IsOptional()
  cancellationReason?: string;

  @ApiPropertyOptional({
    description: 'Rejection reason (required when status=REJECTED)',
  })
  @IsString()
  @MinLength(3)
  @IsOptional()
  rejectionReason?: string;
}
