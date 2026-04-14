import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';

import { ResponseUserDto } from '../user/dtos/response-user.dto';
import { Serialize } from '../../common/decorators/serialize.decorator';

import {
  BookingAvailabilityService,
  type BookingTimeSlot,
} from './services/booking-availability.service';
import { GetAvailableTrainersQueryDto } from './dtos/get-available-trainers.dto';
import { GetAvailableSlotsQueryDto } from './dtos/get-available-slots.dto';

@ApiTags('Booking discovery')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard)
@Controller('booking-discovery')
export class BookingDiscoveryController {
  constructor(
    private readonly bookingAvailabilityService: BookingAvailabilityService,
  ) {}

  @Get('available-trainers')
  @Serialize(ResponseUserDto)
  @ApiOperation({
    summary: 'List available trainers for a time range',
  })
  async getAvailableTrainers(
    @Query() query: GetAvailableTrainersQueryDto,
  ): Promise<BaseResponseDto<ResponseUserDto[]>> {
    const trainers =
      await this.bookingAvailabilityService.getAvailableTrainersForRange({
        start: new Date(query.startTime),
        end: new Date(query.endTime),
      });
    return BaseResponseDto.ok(trainers as unknown as ResponseUserDto[]);
  }

  @Get('available-slots')
  @ApiOperation({
    summary: 'List available slots for a trainer in a range',
  })
  async getAvailableSlots(
    @Query() query: GetAvailableSlotsQueryDto,
  ): Promise<BaseResponseDto<BookingTimeSlot[]>> {
    const slots = await this.bookingAvailabilityService.getAvailableSlots({
      trainerId: query.trainerId,
      rangeStart: new Date(query.rangeStart),
      rangeEnd: new Date(query.rangeEnd),
      durationMinutes: query.durationMinutes ?? 60,
      stepMinutes: query.stepMinutes ?? 30,
    });
    return BaseResponseDto.ok(slots);
  }
}
