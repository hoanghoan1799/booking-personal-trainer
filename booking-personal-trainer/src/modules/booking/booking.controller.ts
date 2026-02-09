import {
  Controller,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Post,
  Req,
} from '@nestjs/common';

// Commons
import type { CurrentRequestUser } from '../../common/interfaces/request.interface';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

// Services
import { BookingService } from './booking.service';

// Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Req() req: CurrentRequestUser, @Body() data: CreateBookingDto) {
    return this.bookingService.create(data, req.user);
  }

  @Get()
  getAll(@Query() query: GetBookingsQueryDto) {
    return this.bookingService.getAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.getOne(id);
  }
}
