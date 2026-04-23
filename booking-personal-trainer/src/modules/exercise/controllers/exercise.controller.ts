import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { Roles } from '../../../common/decorators/role.decorator';
import { UserRole } from '../../../common/enums/user/user.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Serialize } from '../../../common/decorators/serialize.decorator';
import { SuccessMessageResponse } from '../../../common/interfaces/success-message-response.interface';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// DTOs
import { ExercisesQueryDto } from '../dto/query-exercise.dto';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';

// Services
import { ExerciseService } from '../services/exercise.service';
import { ExerciseResponseDto } from '../dto/exercise-response.dto';
import { ExerciseSwagger } from '../constants/exercise-swagger.constants';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../../common/helpers/rate-limit-override.helper';

@ApiTags('Exercise')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(ExerciseSwagger.Controller.ApiExtraModels.ExerciseResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Creating exercises is an admin-only write endpoint that can still be abused
   *   (either by automation or a compromised admin account) to generate DB load.
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
  @Serialize(ExerciseResponseDto)
  @ApiOperation(ExerciseSwagger.Controller.ApiOperation.Create)
  @ApiBody(ExerciseSwagger.Controller.ApiBody.Create)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.CreateCreated)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.BadRequest)
  create(
    @Body() body: CreateExerciseDto,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    return this.exerciseService.create(body);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  @Serialize(ExerciseResponseDto)
  @ApiOperation(ExerciseSwagger.Controller.ApiOperation.GetAll)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.GetAllOk)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Forbidden)
  getAll(@Query() query: ExercisesQueryDto) {
    return this.exerciseService.getAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get(':id')
  @Serialize(ExerciseResponseDto)
  @ApiOperation(ExerciseSwagger.Controller.ApiOperation.GetOne)
  @ApiParam(ExerciseSwagger.Controller.ApiParam.Id)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.GetOneOk)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.NotFound)
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    return this.exerciseService.getOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Repeated updates can create write amplification and degrade DB performance.
   * - Tight shaping protects the system from rapid edit loops / abuse.
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
  @Serialize(ExerciseResponseDto)
  @ApiOperation(ExerciseSwagger.Controller.ApiOperation.Update)
  @ApiParam(ExerciseSwagger.Controller.ApiParam.Id)
  @ApiBody(ExerciseSwagger.Controller.ApiBody.Update)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.UpdateOk)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.NotFound)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateExerciseDto,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    return this.exerciseService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/restore')
  /**
   * Rate-limit override (moderate).
   *
   * Why:
   * - Restore operations are administrative state changes.
   * - Slightly stricter than baseline to prevent rapid repeated restores.
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
  })
  @ApiOperation(ExerciseSwagger.Controller.ApiOperation.Restore)
  @ApiParam(ExerciseSwagger.Controller.ApiParam.Id)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.RestoreOk)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.NotFound)
  restore(@Param('id') id: string): Promise<SuccessMessageResponse> {
    return this.exerciseService.restore(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  /**
   * Rate-limit override (strict).
   *
   * Why:
   * - Delete is destructive; stricter limits reduce the speed at which data can be removed.
   * - Helps limit damage from accidental scripts or compromised admin credentials.
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
  @ApiOperation(ExerciseSwagger.Controller.ApiOperation.Delete)
  @ApiParam(ExerciseSwagger.Controller.ApiParam.Id)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.DeleteOk)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(ExerciseSwagger.Controller.ApiResponse.NotFound)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessMessageResponse> {
    return this.exerciseService.softDelete(id);
  }
}
