import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// Commons
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// Types
import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';

// DTOs
import { StripeConnectOnboardingLinkResponseDto } from '../dtos/stripe-connect-onboarding-link-response.dto';

// Services
import { TrainerStripeConnectService } from '../services/trainer-stripe-connect.service';
import { PaymentsSwagger } from '../constants/payments-swagger.constants';

@ApiTags('Payments')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers/me/stripe-connect')
export class TrainerStripeConnectController {
  constructor(
    private readonly trainerStripeConnectService: TrainerStripeConnectService,
  ) {}

  @Roles(UserRole.TRAINER)
  @Post('onboard')
  @ApiOperation(
    PaymentsSwagger.Controller.TrainerStripeConnect.ApiOperation.Onboard,
  )
  @ApiResponse(
    PaymentsSwagger.Controller.TrainerStripeConnect.ApiResponse.OnboardCreated,
  )
  async createOnboardingLink(
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<StripeConnectOnboardingLinkResponseDto>> {
    const result = await this.trainerStripeConnectService.createOnboardingLink({
      currentUserId: currentUser.id,
    });
    return BaseResponseDto.ok(result);
  }
}
