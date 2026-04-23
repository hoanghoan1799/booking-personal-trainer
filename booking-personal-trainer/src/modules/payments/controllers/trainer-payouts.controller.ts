import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/enums/user/user.enum';

import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';
import { TrainerPayoutsQueryDto } from '../dtos/trainer-payouts-query.dto';
import { TrainerPayoutsResponseDto } from '../dtos/trainer-payouts-response.dto';
import { TrainerPayoutsService } from '../services/trainer-payouts.service';
import { PaymentsSwagger } from '../constants/payments-swagger.constants';

@ApiTags('Payments')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers/me/payouts')
export class TrainerPayoutsController {
  constructor(private readonly trainerPayoutsService: TrainerPayoutsService) {}

  @Roles(UserRole.TRAINER)
  @Get()
  @ApiOperation(
    PaymentsSwagger.Controller.TrainerPayouts.ApiOperation.GetMyPayouts,
  )
  @ApiResponse(
    PaymentsSwagger.Controller.TrainerPayouts.ApiResponse.GetMyPayoutsOk,
  )
  async getMyPayouts(
    @CurrentUser() currentUser: JwtAuthPayload,
    @Query() query: TrainerPayoutsQueryDto,
  ): Promise<BaseResponseDto<TrainerPayoutsResponseDto>> {
    const result = await this.trainerPayoutsService.getMyPayouts({
      trainerId: currentUser.id,
      query,
    });
    return BaseResponseDto.ok(result);
  }
}
