import { IsUUID, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  trainerId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
