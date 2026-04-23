import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

import { ReportingDtoSwagger } from '../constants/reporting-swagger-dto.constants';

export class LoyalUserRowDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  userName!: string;

  @ApiProperty()
  @IsString()
  userEmail!: string;

  @ApiProperty(ReportingDtoSwagger.LoyalUserRow.ApiProperty.BookingsCount)
  @IsInt()
  bookingsCount!: number;

  @ApiProperty()
  @IsInt()
  confirmedBookingsCount!: number;
}
