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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { Serialize } from '../../common/decorators/serialize.decorator';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { BookingResponseDto } from './dtos/response-booking.dto';

// Services
import { BookingService } from './booking.service';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Serialize(BookingResponseDto)
  async create(
    @Req() req: CurrentRequestUser,
    @Body() data: CreateBookingDto,
  ): Promise<BaseResponseDto<BookingResponseDto>> {
    return BaseResponseDto.ok(await this.bookingService.create(data, req.user));
  }

  @Get()
  @Serialize(BookingResponseDto)
  getAll(
    @Query() query: GetBookingsQueryDto,
  ): Promise<BaseResponseDto<BookingResponseDto[]>> {
    return this.bookingService.getAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.getOne(id);
  }
}
