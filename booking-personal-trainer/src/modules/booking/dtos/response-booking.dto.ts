import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

// DTOs
import { ResponseUserDto } from '../../user/dtos/response-user.dto';

export class BookingResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.TRAINER,
    type: () => ResponseUserDto,
  })
  @Expose()
  @Type(() => ResponseUserDto)
  trainer: ResponseUserDto;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.TRAINEE,
    type: () => ResponseUserDto,
  })
  @Expose()
  @Type(() => ResponseUserDto)
  trainee: ResponseUserDto;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.STATUS,
    enum: BookingStatus,
  })
  @Expose()
  status: BookingStatus;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.START_TIME,
    type: Date,
  })
  @Expose()
  startTime: Date;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.END_TIME,
    type: Date,
  })
  @Expose()
  endTime: Date;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.BOOKING.CREATED_AT,
  })
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT,
  })
  @Expose()
  updatedAt?: Date;
}
