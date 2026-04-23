import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

// Commons
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

export class GetBookingsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional(
    BookingDtoSwagger.GetBookingsQuery.ApiPropertyOptional.Status,
  )
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
