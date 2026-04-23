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
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
} from '@nestjs/swagger';

// Commons
import type { CurrentRequestUser } from '../../../common/interfaces/request.interface';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { UserRole } from '../../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { Serialize } from '../../../common/decorators/serialize.decorator';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// DTOs
import { GetBookingsQueryDto } from '../dtos/get-booking.dto';
import { CreateBookingDto } from '../dtos/create-booking.dto';
import { CreateBookingsBulkDto } from '../dtos/create-bookings-bulk.dto';
import { UpdateBookingStatusDto } from '../dtos/update-booking-status.dto';
import { BookingResponseDto } from '../dtos/response-booking.dto';

// Services
import { BookingService } from '../services/booking.service';
import { BookingSwagger } from '../constants/booking-swagger.constants';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../../common/helpers/rate-limit-override.helper';

@ApiTags('Booking')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(
  BookingSwagger.Controller.ApiExtraModels.Booking,
  BookingSwagger.Controller.ApiExtraModels.User,
)
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('bulk')
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 4, token: 6, user: 8 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 20, token: 30, user: 40 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 120,
        token: 200,
        user: 300,
      }),
    },
  })
  @Serialize(BookingResponseDto)
  @ApiOperation(BookingSwagger.Controller.ApiOperation.CreateBulk)
  @ApiBody(BookingSwagger.Controller.ApiBody.CreateBulk)
  async createBulk(
    @Req() req: CurrentRequestUser,
    @Body() data: CreateBookingsBulkDto,
  ): Promise<BaseResponseDto<BookingResponseDto[]>> {
    const bookings = await this.bookingService.createBulk(data, req.user);
    return BaseResponseDto.ok(bookings as unknown as BookingResponseDto[]);
  }

  @Post()
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Creating bookings is a write operation and can be abused for spam / resource exhaustion.
   * - This also protects trainer availability checks and DB writes from high-frequency abuse.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 8, token: 12, user: 15 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 40, token: 60, user: 80 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 300,
        token: 500,
        user: 700,
      }),
    },
  })
  @Serialize(BookingResponseDto)
  @ApiOperation(BookingSwagger.Controller.ApiOperation.Create)
  @ApiBody(BookingSwagger.Controller.ApiBody.Create)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.CreateCreated)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.CreateBadRequest)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.CreateNotFound)
  async create(
    @Req() req: CurrentRequestUser,
    @Body() data: CreateBookingDto,
  ): Promise<BaseResponseDto<BookingResponseDto>> {
    return BaseResponseDto.ok(await this.bookingService.create(data, req.user));
  }

  @Get()
  @Serialize(BookingResponseDto)
  @ApiOperation(BookingSwagger.Controller.ApiOperation.GetAll)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.GetAllOk)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.Unauthorized)
  getAll(
    @Query() query: GetBookingsQueryDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<BookingResponseDto[]>> {
    return this.bookingService.getAll(query, req.user);
  }

  @Get(':id')
  @Serialize(BookingResponseDto)
  @ApiOperation(BookingSwagger.Controller.ApiOperation.GetOne)
  @ApiParam(BookingSwagger.Controller.ApiParam.Id)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.GetOneOk)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.GetOneNotFound)
  findOne(@Param('id') id: string) {
    return this.bookingService.getOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @UseGuards(RolesGuard)
  @Patch(':id/status')
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Status updates are state-changing operations that can trigger business workflows/notifications.
   * - Tightening limits reduces the impact of abusive clients repeatedly toggling status.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 10, token: 15, user: 20 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({
        ip: 60,
        token: 90,
        user: 120,
      }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 500,
        token: 800,
        user: 1200,
      }),
    },
  })
  @Serialize(BookingResponseDto)
  @ApiOperation(BookingSwagger.Controller.ApiOperation.UpdateStatus)
  @ApiParam(BookingSwagger.Controller.ApiParam.Id)
  @ApiBody(BookingSwagger.Controller.ApiBody.UpdateStatus)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.UpdateStatusOk)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.UpdateStatusBadRequest)
  @ApiResponse(BookingSwagger.Controller.ApiResponse.UpdateStatusNotFound)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<BookingResponseDto>> {
    const booking = await this.bookingService.updateStatus(id, body, req.user);
    return BaseResponseDto.ok(booking);
  }
}
