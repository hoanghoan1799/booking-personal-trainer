import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
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
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../common/constants/message.constant';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';

// DTOs
import { CreateTrainerAvailabilityDto } from './dtos/create-trainer-availability.dto';
import { UpdateTrainerAvailabilityDto } from './dtos/update-trainer-availability.dto';
import { TrainerAvailabilityResponseDto } from './dtos/trainer-availability-response.dto';
import { UpdateTrainerAvailabilityResponseDto } from './dtos/update-trainer-availability-response.dto';
import { CreateTrainerTimeOffDto } from './dtos/create-trainer-time-off.dto';
import { UpdateTrainerTimeOffDto } from './dtos/update-trainer-time-off.dto';
import { TrainerTimeOffResponseDto } from './dtos/trainer-time-off-response.dto';

// Services
import { TrainerAvailabilityService } from './trainer-availability.service';
import { TrainerTimeOffService } from './trainer-time-off.service';

@ApiTags('Trainer scheduling')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(
  TrainerAvailabilityResponseDto,
  UpdateTrainerAvailabilityResponseDto,
  TrainerTimeOffResponseDto,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
@Controller('trainers')
export class TrainersController {
  constructor(
    private readonly trainerAvailabilityService: TrainerAvailabilityService,
    private readonly trainerTimeOffService: TrainerTimeOffService,
  ) {}

  @Get('me/availabilities')
  @Serialize(TrainerAvailabilityResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_AVAILABILITIES_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_AVAILABILITIES_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_LIST_RETRIEVED,
    schema: {
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(TrainerAvailabilityResponseDto) },
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
  getMyAvailabilities(
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerAvailabilityResponseDto[]>> {
    return this.trainerAvailabilityService.getMyAvailabilities(req.user);
  }

  @Post('me/availabilities')
  @Serialize(TrainerAvailabilityResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_AVAILABILITY_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_AVAILABILITY_DESCRIPTION,
  })
  @ApiBody({ type: CreateTrainerAvailabilityDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_CREATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(TrainerAvailabilityResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  async createMyAvailability(
    @Body() body: CreateTrainerAvailabilityDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerAvailabilityResponseDto>> {
    const created = await this.trainerAvailabilityService.createMyAvailability(
      body,
      req.user,
    );
    return BaseResponseDto.ok(
      created as unknown as TrainerAvailabilityResponseDto,
    );
  }

  @Patch('me/availabilities/:availabilityId')
  @Serialize(UpdateTrainerAvailabilityResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_AVAILABILITY_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_AVAILABILITY_DESCRIPTION,
  })
  @ApiParam({ name: 'availabilityId', type: String })
  @ApiBody({ type: UpdateTrainerAvailabilityDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(UpdateTrainerAvailabilityResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  async updateMyAvailability(
    @Param('availabilityId') availabilityId: string,
    @Body() body: UpdateTrainerAvailabilityDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<UpdateTrainerAvailabilityResponseDto>> {
    const updated = await this.trainerAvailabilityService.updateMyAvailability(
      availabilityId,
      body,
      req.user,
    );
    return BaseResponseDto.ok(
      updated as unknown as UpdateTrainerAvailabilityResponseDto,
    );
  }

  @Delete('me/availabilities/:availabilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_AVAILABILITY_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_AVAILABILITY_DESCRIPTION,
  })
  @ApiParam({ name: 'availabilityId', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_DELETED,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  async deleteMyAvailability(
    @Param('availabilityId') availabilityId: string,
    @Req() req: CurrentRequestUser,
  ): Promise<void> {
    await this.trainerAvailabilityService.deleteMyAvailability(
      availabilityId,
      req.user,
    );
  }

  @Get('me/time-off')
  @Serialize(TrainerTimeOffResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_TIME_OFF_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_TIME_OFF_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_LIST_RETRIEVED,
    schema: {
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(TrainerTimeOffResponseDto) },
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
  getMyTimeOff(
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerTimeOffResponseDto[]>> {
    return this.trainerTimeOffService.getMyTimeOff(req.user);
  }

  @Post('me/time-off')
  @Serialize(TrainerTimeOffResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_TIME_OFF_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_TIME_OFF_DESCRIPTION,
  })
  @ApiBody({ type: CreateTrainerTimeOffDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_CREATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(TrainerTimeOffResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  async createMyTimeOff(
    @Body() body: CreateTrainerTimeOffDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerTimeOffResponseDto>> {
    const created = await this.trainerTimeOffService.createMyTimeOff(
      body,
      req.user,
    );
    return BaseResponseDto.ok(created as unknown as TrainerTimeOffResponseDto);
  }

  @Patch('me/time-off/:timeOffId')
  @Serialize(TrainerTimeOffResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_TIME_OFF_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_TIME_OFF_DESCRIPTION,
  })
  @ApiParam({ name: 'timeOffId', type: String })
  @ApiBody({ type: UpdateTrainerTimeOffDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(TrainerTimeOffResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  async updateMyTimeOff(
    @Param('timeOffId') timeOffId: string,
    @Body() body: UpdateTrainerTimeOffDto,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerTimeOffResponseDto>> {
    const updated = await this.trainerTimeOffService.updateMyTimeOff(
      timeOffId,
      body,
      req.user,
    );
    return BaseResponseDto.ok(updated as unknown as TrainerTimeOffResponseDto);
  }

  @Delete('me/time-off/:timeOffId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_TIME_OFF_SUMMARY,
    description:
      API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_TIME_OFF_DESCRIPTION,
  })
  @ApiParam({ name: 'timeOffId', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_DELETED,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  async deleteMyTimeOff(
    @Param('timeOffId') timeOffId: string,
    @Req() req: CurrentRequestUser,
  ): Promise<void> {
    await this.trainerTimeOffService.deleteMyTimeOff(timeOffId, req.user);
  }
}
