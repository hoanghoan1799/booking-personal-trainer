import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
  Query,
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
import { CurrentUser } from '../../common/decorators/user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuccessMessageResponse } from '../../common/interfaces/success-message-response.interface';
import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FIELD_DESCRIPTIONS,
} from '../../common/constants/message.constant';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';

// Entities
import { User } from '../user/entities/user.entity';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import {
  UpdateWorkoutDetailDto,
  ExerciseCompletionDto,
} from './dtos/update-workout-detail.dto';
import { WorkoutsQueryDto } from './dtos/query-workout.dto';
import {
  WorkoutResponseDto,
  WorkoutExerciseResponseDto,
} from './dtos/workout-response.dto';
import { ResponseUserDto } from '../user/dtos/response-user.dto';
import { ExerciseResponseDto } from '../exercise/dto/exercise-response.dto';

// Services
import { WorkoutService } from './workout.service';

// Decorators
import { Serialize } from '../../common/decorators/serialize.decorator';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../common/helpers/rate-limit-override.helper';

@ApiTags('Workout')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(
  WorkoutResponseDto,
  WorkoutExerciseResponseDto,
  ResponseUserDto,
  ExerciseResponseDto,
  ExerciseCompletionDto,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workouts')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post()
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Workout creation is a write-heavy endpoint and can cause significant DB load.
   * - Tight limits prevent spam creation and reduce blast radius from compromised accounts.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 8, token: 12, user: 15 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 40, token: 60, user: 90 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 300,
        token: 500,
        user: 900,
      }),
    },
  })
  @Serialize(WorkoutResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.WORKOUT.CREATE_SUMMARY,
    description: API_DESCRIPTIONS.WORKOUT.CREATE_DESCRIPTION,
  })
  @ApiBody({ type: CreateWorkoutDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: SUCCESS_MESSAGES.WORKOUT.CREATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(WorkoutResponseDto) },
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
    description: `${ERROR_MESSAGES.WORKOUT.INVALID_TIME_RANGE} or ${ERROR_MESSAGES.WORKOUT.INVALID_EXERCISES}`,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.USER.NOT_FOUND,
  })
  async create(
    @CurrentUser() trainer: User,
    @Body() body: CreateWorkoutDto,
  ): Promise<BaseResponseDto<WorkoutResponseDto>> {
    const workout = await this.workoutService.create(trainer.id, body);
    return BaseResponseDto.ok(workout);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get()
  @Serialize(WorkoutResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.WORKOUT.GET_ALL_SUMMARY,
    description: API_DESCRIPTIONS.WORKOUT.GET_ALL_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.WORKOUT.LIST_RETRIEVED,
    schema: {
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(WorkoutResponseDto) },
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
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ERROR_MESSAGES.AUTH.FORBIDDEN,
  })
  findAll(
    @Query() query: WorkoutsQueryDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<WorkoutResponseDto[]>> {
    return this.workoutService.getAll(query, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get(':id')
  @Serialize(WorkoutResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.WORKOUT.GET_ONE_SUMMARY,
    description: API_DESCRIPTIONS.WORKOUT.GET_ONE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.WORKOUT.ID,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.WORKOUT.RETRIEVED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(WorkoutResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.WORKOUT.NOT_FOUND,
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<WorkoutResponseDto>> {
    const workout = await this.workoutService.getOneForUser(id, req.user);
    return BaseResponseDto.ok(workout);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Patch(':id')
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Updates can be repeatedly called to generate write amplification and contention.
   * - Stricter shaping helps protect database performance and prevents noisy clients from spamming updates.
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
  @Serialize(WorkoutResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.WORKOUT.UPDATE_DETAIL_SUMMARY,
    description: API_DESCRIPTIONS.WORKOUT.UPDATE_DETAIL_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.WORKOUT.ID,
    type: String,
  })
  @ApiBody({ type: UpdateWorkoutDetailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.WORKOUT.DETAIL_UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(WorkoutResponseDto) },
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
    description: ERROR_MESSAGES.WORKOUT.CANNOT_UPDATE_EXERCISES,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.WORKOUT.NOT_FOUND,
  })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateWorkoutDetailDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<WorkoutResponseDto>> {
    const workout = await this.workoutService.updateDetail(id, body, req.user);
    return BaseResponseDto.ok(workout);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Delete(':id')
  /**
   * Rate-limit override (strict).
   *
   * Why:
   * - Delete operations are destructive and can be abused to wipe data quickly.
   * - Stricter limits reduce the speed of destructive actions (even by authorized roles).
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 5, token: 8, user: 10 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 20, token: 30, user: 40 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 100,
        token: 160,
        user: 250,
      }),
    },
  })
  @ApiOperation({
    summary: API_DESCRIPTIONS.WORKOUT.DELETE_SUMMARY,
    description: API_DESCRIPTIONS.WORKOUT.DELETE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.WORKOUT.ID,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.WORKOUT.DELETED,
    schema: {
      properties: {
        message: { type: 'string' },
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
  remove(): Promise<SuccessMessageResponse> {
    return this.workoutService.removeAll();
  }
}
