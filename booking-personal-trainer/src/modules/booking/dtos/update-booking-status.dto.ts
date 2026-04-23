import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

export class UpdateBookingStatusDto {
  @ApiProperty(BookingDtoSwagger.UpdateBookingStatus.ApiProperty.Status)
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional(
    BookingDtoSwagger.UpdateBookingStatus.ApiPropertyOptional
      .CancellationReason,
  )
  @IsString()
  @MinLength(3)
  @IsOptional()
  cancellationReason?: string;

  @ApiPropertyOptional(
    BookingDtoSwagger.UpdateBookingStatus.ApiPropertyOptional.RejectionReason,
  )
  @IsString()
  @MinLength(3)
  @IsOptional()
  rejectionReason?: string;
}
