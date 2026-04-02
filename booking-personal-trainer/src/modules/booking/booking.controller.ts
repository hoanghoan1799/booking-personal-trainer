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
  HttpStatus,
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
  getSchemaPath,
} from '@nestjs/swagger';

// Commons
import type { CurrentRequestUser } from '../../common/interfaces/request.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { Serialize } from '../../common/decorators/serialize.decorator';
import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FIELD_DESCRIPTIONS,
} from '../../common/constants/message.constant';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { UpdateBookingStatusDto } from './dtos/update-booking-status.dto';
import { BookingResponseDto } from './dtos/response-booking.dto';
import { ResponseUserDto } from '../user/dtos/response-user.dto';

// Services
import { BookingService } from './booking.service';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../common/helpers/rate-limit-override.helper';

@ApiTags('Booking')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(BookingResponseDto, ResponseUserDto)
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

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
  @ApiOperation({
    summary: API_DESCRIPTIONS.BOOKING.CREATE_SUMMARY,
    description: API_DESCRIPTIONS.BOOKING.CREATE_DESCRIPTION,
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: SUCCESS_MESSAGES.BOOKING.CREATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(BookingResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `${ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE} or ${ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST} or ${ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES} or ${ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF} or ${ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE}`,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE,
  })
  async create(
    @Req() req: CurrentRequestUser,
    @Body() data: CreateBookingDto,
  ): Promise<BaseResponseDto<BookingResponseDto>> {
    return BaseResponseDto.ok(await this.bookingService.create(data, req.user));
  }

  @Get()
  @Serialize(BookingResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.BOOKING.GET_ALL_SUMMARY,
    description: API_DESCRIPTIONS.BOOKING.GET_ALL_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.BOOKING.LIST_RETRIEVED,
    schema: {
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(BookingResponseDto) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  getAll(
    @Query() query: GetBookingsQueryDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<BookingResponseDto[]>> {
    return this.bookingService.getAll(query, req.user);
  }

  @Get(':id')
  @Serialize(BookingResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.BOOKING.GET_ONE_SUMMARY,
    description: API_DESCRIPTIONS.BOOKING.GET_ONE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.BOOKING.ID,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.BOOKING.RETRIEVED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(BookingResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.BOOKING.NOT_FOUND,
  })
  findOne(@Param('id') id: string) {
    return this.bookingService.getOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.BOOKING.UPDATE_STATUS_SUMMARY,
    description: API_DESCRIPTIONS.BOOKING.UPDATE_STATUS_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.BOOKING.ID,
    type: String,
  })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.BOOKING.STATUS_UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(BookingResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ERROR_MESSAGES.AUTH.FORBIDDEN,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.BOOKING.NOT_FOUND,
  })
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
