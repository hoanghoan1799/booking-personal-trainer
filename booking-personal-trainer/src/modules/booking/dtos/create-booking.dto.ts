import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString } from 'class-validator';

// Constants
import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

export class CreateBookingDto {
  @ApiProperty(BookingDtoSwagger.CreateBooking.ApiProperty.TrainerId)
  @IsUUID()
  trainerId: string;

  @ApiProperty(BookingDtoSwagger.CreateBooking.ApiProperty.StartTime)
  @IsDateString()
  startTime: string;

  @ApiProperty(BookingDtoSwagger.CreateBooking.ApiProperty.EndTime)
  @IsDateString()
  endTime: string;
}
