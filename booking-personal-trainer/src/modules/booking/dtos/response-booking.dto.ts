import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

// DTOs
import { ResponseUserDto } from '../../user/dtos/response-user.dto';

export class BookingResponseDto {
  @ApiProperty(BookingDtoSwagger.BookingResponse.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(BookingDtoSwagger.BookingResponse.ApiProperty.Trainer)
  @Expose()
  @Type(() => ResponseUserDto)
  trainer: ResponseUserDto;

  @ApiProperty(BookingDtoSwagger.BookingResponse.ApiProperty.Trainee)
  @Expose()
  @Type(() => ResponseUserDto)
  trainee: ResponseUserDto;

  @ApiProperty(BookingDtoSwagger.BookingResponse.ApiProperty.Status)
  @Expose()
  status: BookingStatus;

  @ApiPropertyOptional(
    BookingDtoSwagger.BookingResponse.ApiPropertyOptional.StatusChangedAt,
  )
  @Expose()
  statusChangedAt?: Date | null;

  @ApiPropertyOptional(
    BookingDtoSwagger.BookingResponse.ApiPropertyOptional.CancelledById,
  )
  @Expose()
  cancelledById?: string | null;

  @ApiPropertyOptional(
    BookingDtoSwagger.BookingResponse.ApiPropertyOptional.CancellationReason,
  )
  @Expose()
  cancellationReason?: string | null;

  @ApiPropertyOptional(
    BookingDtoSwagger.BookingResponse.ApiPropertyOptional.RejectionReason,
  )
  @Expose()
  rejectionReason?: string | null;

  @ApiProperty(BookingDtoSwagger.BookingResponse.ApiProperty.StartTime)
  @Expose()
  startTime: Date;

  @ApiProperty(BookingDtoSwagger.BookingResponse.ApiProperty.EndTime)
  @Expose()
  endTime: Date;

  @ApiPropertyOptional(
    BookingDtoSwagger.BookingResponse.ApiPropertyOptional.CreatedAt,
  )
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional(
    BookingDtoSwagger.BookingResponse.ApiPropertyOptional.UpdatedAt,
  )
  @Expose()
  updatedAt?: Date;
}
