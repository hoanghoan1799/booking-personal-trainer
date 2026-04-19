import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

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

  @ApiProperty({ description: 'Bookings in scope (by createdAt).' })
  @IsInt()
  bookingsCount!: number;

  @ApiProperty()
  @IsInt()
  confirmedBookingsCount!: number;
}
