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
import { CreateTrainerAvailabilityDto } from '../dtos/create-trainer-availability.dto';
import { UpdateTrainerAvailabilityDto } from '../dtos/update-trainer-availability.dto';
import { TrainerAvailabilityResponseDto } from '../dtos/trainer-availability-response.dto';
import { UpdateTrainerAvailabilityResponseDto } from '../dtos/update-trainer-availability-response.dto';
import { CreateTrainerTimeOffDto } from '../dtos/create-trainer-time-off.dto';
import { UpdateTrainerTimeOffDto } from '../dtos/update-trainer-time-off.dto';
import { TrainerTimeOffResponseDto } from '../dtos/trainer-time-off-response.dto';

// Services
import { TrainerAvailabilityService } from '../services/trainer-availability.service';
import { TrainerTimeOffService } from '../services/trainer-time-off.service';
import { TrainerSchedulingSwagger } from '../constants/trainer-scheduling-swagger.constants';

@ApiTags('Trainer scheduling')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(
  TrainerSchedulingSwagger.Controller.ApiExtraModels.Availability,
  TrainerSchedulingSwagger.Controller.ApiExtraModels.AvailabilityUpdate,
  TrainerSchedulingSwagger.Controller.ApiExtraModels.TimeOff,
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
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.GetMyAvailabilities,
  )
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.GetMyAvailabilitiesOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
  getMyAvailabilities(
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerAvailabilityResponseDto[]>> {
    return this.trainerAvailabilityService.getMyAvailabilities(req.user);
  }

  @Post('me/availabilities')
  @Serialize(TrainerAvailabilityResponseDto)
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.CreateMyAvailability,
  )
  @ApiBody(TrainerSchedulingSwagger.Controller.ApiBody.CreateMyAvailability)
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.CreateMyAvailabilityOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
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
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.UpdateMyAvailability,
  )
  @ApiParam(TrainerSchedulingSwagger.Controller.ApiParam.AvailabilityId)
  @ApiBody(TrainerSchedulingSwagger.Controller.ApiBody.UpdateMyAvailability)
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.UpdateMyAvailabilityOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
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
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.DeleteMyAvailability,
  )
  @ApiParam(TrainerSchedulingSwagger.Controller.ApiParam.AvailabilityId)
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.DeleteMyAvailabilityOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
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
  @ApiOperation(TrainerSchedulingSwagger.Controller.ApiOperation.GetMyTimeOff)
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.GetMyTimeOffOk)
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
  getMyTimeOff(
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<TrainerTimeOffResponseDto[]>> {
    return this.trainerTimeOffService.getMyTimeOff(req.user);
  }

  @Post('me/time-off')
  @Serialize(TrainerTimeOffResponseDto)
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.CreateMyTimeOff,
  )
  @ApiBody(TrainerSchedulingSwagger.Controller.ApiBody.CreateMyTimeOff)
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.CreateMyTimeOffOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
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
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.UpdateMyTimeOff,
  )
  @ApiParam(TrainerSchedulingSwagger.Controller.ApiParam.TimeOffId)
  @ApiBody(TrainerSchedulingSwagger.Controller.ApiBody.UpdateMyTimeOff)
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.UpdateMyTimeOffOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
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
  @ApiOperation(
    TrainerSchedulingSwagger.Controller.ApiOperation.DeleteMyTimeOff,
  )
  @ApiParam(TrainerSchedulingSwagger.Controller.ApiParam.TimeOffId)
  @ApiResponse(
    TrainerSchedulingSwagger.Controller.ApiResponse.DeleteMyTimeOffOk,
  )
  @ApiResponse(TrainerSchedulingSwagger.Controller.ApiResponse.Unauthorized)
  async deleteMyTimeOff(
    @Param('timeOffId') timeOffId: string,
    @Req() req: CurrentRequestUser,
  ): Promise<void> {
    await this.trainerTimeOffService.deleteMyTimeOff(timeOffId, req.user);
  }
}
