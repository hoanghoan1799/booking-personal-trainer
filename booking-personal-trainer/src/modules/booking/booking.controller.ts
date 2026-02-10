import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  Post,
  Req,
} from '@nestjs/common';

// Commons
import type { CurrentRequestUser } from '../../common/interfaces/request.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { Serialize } from '../../common/decorators/serialize.decorator';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { UpdateBookingStatusDto } from './dtos/update-booking-status.dto';
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
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<BookingResponseDto[]>> {
    return this.bookingService.getAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.getOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @UseGuards(RolesGuard)
  @Patch(':id/status')
  @Serialize(BookingResponseDto)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<BookingResponseDto>> {
    const booking = await this.bookingService.updateStatus(
      id,
      body.status,
      req.user,
    );
    return BaseResponseDto.ok(booking);
  }
}
