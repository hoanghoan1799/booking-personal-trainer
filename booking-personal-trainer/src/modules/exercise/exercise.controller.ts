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
  HttpStatus,
} from '@nestjs/common';
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
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { SuccessMessageResponse } from '../../common/interfaces/success-message-response.interface';
import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
  SUCCESS_MESSAGES,
} from '../../common/constants/message.constant';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';

// DTOs
import { ExercisesQueryDto } from './dto/query-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

// Services
import { ExerciseService } from './exercise.service';
import { ExerciseResponseDto } from './dto/exercise-response.dto';

@ApiTags('Exercise')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(ExerciseResponseDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @Serialize(ExerciseResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.EXERCISE.CREATE_SUMMARY,
    description: API_DESCRIPTIONS.EXERCISE.CREATE_DESCRIPTION,
  })
  @ApiBody({ type: CreateExerciseDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: SUCCESS_MESSAGES.EXERCISE.CREATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ExerciseResponseDto) },
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
    description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
  })
  create(
    @Body() body: CreateExerciseDto,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    return this.exerciseService.create(body);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  @Serialize(ExerciseResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.EXERCISE.GET_ALL_SUMMARY,
    description: API_DESCRIPTIONS.EXERCISE.GET_ALL_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.EXERCISE.LIST_RETRIEVED,
    schema: {
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ExerciseResponseDto) },
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
  getAll(@Query() query: ExercisesQueryDto) {
    return this.exerciseService.getAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get(':id')
  @Serialize(ExerciseResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.EXERCISE.GET_ONE_SUMMARY,
    description: API_DESCRIPTIONS.EXERCISE.GET_ONE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.EXERCISE.ID,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.EXERCISE.RETRIEVED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ExerciseResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.EXERCISE.NOT_FOUND,
  })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    return this.exerciseService.getOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @Serialize(ExerciseResponseDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.EXERCISE.UPDATE_SUMMARY,
    description: API_DESCRIPTIONS.EXERCISE.UPDATE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.EXERCISE.ID,
    type: String,
  })
  @ApiBody({ type: UpdateExerciseDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.EXERCISE.UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ExerciseResponseDto) },
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
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.EXERCISE.NOT_FOUND,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateExerciseDto,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    return this.exerciseService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/restore')
  @ApiOperation({
    summary: API_DESCRIPTIONS.EXERCISE.RESTORE_SUMMARY,
    description: API_DESCRIPTIONS.EXERCISE.RESTORE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.EXERCISE.ID,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.EXERCISE.RESTORED,
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.EXERCISE.NOT_FOUND,
  })
  restore(@Param('id') id: string): Promise<SuccessMessageResponse> {
    return this.exerciseService.restore(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: API_DESCRIPTIONS.EXERCISE.DELETE_SUMMARY,
    description: API_DESCRIPTIONS.EXERCISE.DELETE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.ID,
    description: FIELD_DESCRIPTIONS.EXERCISE.ID,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.EXERCISE.DELETED,
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.EXERCISE.NOT_FOUND,
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessMessageResponse> {
    return this.exerciseService.softDelete(id);
  }
}
