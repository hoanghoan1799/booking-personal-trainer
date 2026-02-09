import { Expose, Type } from 'class-transformer';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';

// DTOs
import { ResponseUserDto } from '../../user/dtos/response-user.dto';

export class BookingResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => ResponseUserDto)
  trainer: ResponseUserDto;

  @Expose()
  @Type(() => ResponseUserDto)
  trainee: ResponseUserDto;

  @Expose()
  status: BookingStatus;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}
