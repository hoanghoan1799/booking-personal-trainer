import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import dayjs from '../../../common/utils/date-time/utc-dayjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';

import { ResponseUserDto } from '../../user/dtos/response-user.dto';
import { Serialize } from '../../../common/decorators/serialize.decorator';

import {
  BookingAvailabilityService,
  type BookingTimeSlot,
} from '../services/booking-availability.service';
import { GetAvailableTrainersQueryDto } from '../dtos/get-available-trainers.dto';
import { GetAvailableSlotsQueryDto } from '../dtos/get-available-slots.dto';
import { GetAvailableTrainersForPeriodQueryDto } from '../dtos/get-available-trainers-for-period.dto';
import { BookingSwagger } from '../constants/booking-swagger.constants';

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
  @ApiOperation(BookingSwagger.Controller.ApiOperation.AvailableTrainers)
  async getAvailableTrainers(
    @Query() query: GetAvailableTrainersQueryDto,
  ): Promise<BaseResponseDto<ResponseUserDto[]>> {
    const trainers =
      await this.bookingAvailabilityService.getAvailableTrainersForRange({
        start: dayjs.utc(query.startTime).toDate(),
        end: dayjs.utc(query.endTime).toDate(),
      });
    return BaseResponseDto.ok(trainers as unknown as ResponseUserDto[]);
  }

  @Get('available-slots')
  @ApiOperation(BookingSwagger.Controller.ApiOperation.AvailableSlots)
  async getAvailableSlots(
    @Query() query: GetAvailableSlotsQueryDto,
  ): Promise<BaseResponseDto<BookingTimeSlot[]>> {
    const slots = await this.bookingAvailabilityService.getAvailableSlots({
      trainerId: query.trainerId,
      rangeStart: dayjs.utc(query.rangeStart).toDate(),
      rangeEnd: dayjs.utc(query.rangeEnd).toDate(),
      durationMinutes: query.durationMinutes ?? 60,
      stepMinutes: query.stepMinutes ?? 30,
    });
    return BaseResponseDto.ok(slots);
  }

  @Get('available-trainers-for-period')
  @Serialize(ResponseUserDto)
  @ApiOperation(
    BookingSwagger.Controller.ApiOperation.AvailableTrainersForPeriod,
  )
  async getAvailableTrainersForPeriod(
    @Query() query: GetAvailableTrainersForPeriodQueryDto,
  ): Promise<BaseResponseDto<ResponseUserDto[]>> {
    const trainers =
      await this.bookingAvailabilityService.getAvailableTrainersForPeriod({
        startDateLocal: query.startDate,
        startClockTime: query.startClockTime,
        endClockTime: query.endClockTime,
        period: query.period,
      });
    return BaseResponseDto.ok(trainers as unknown as ResponseUserDto[]);
  }
}
