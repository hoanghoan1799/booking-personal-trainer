// TODO: Need to implement
import { PartialType } from '@nestjs/mapped-types';

// DTOs
import { CreateBookingDto } from './create-booking.dto';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {}
