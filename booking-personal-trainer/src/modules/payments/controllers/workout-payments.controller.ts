import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// Commons
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { UserRole } from '../../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import type { CurrentRequestUser } from '../../../common/interfaces/request.interface';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// DTOs
import { CreateWorkoutPaymentIntentResponseDto } from '../dtos/create-workout-payment-intent-response.dto';
import { WorkoutPaymentAccessResponseDto } from '../dtos/workout-payment-access-response.dto';

// Services
import { PaymentsService } from '../services/payments.service';
import { WorkoutPaymentPolicyService } from '../services/workout-payment-policy.service';
import { EntityManager } from '@mikro-orm/core';
import { Workout } from '../../workout/entities/workout.entity';

@ApiTags('Payments')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workouts/:id/payments')
export class WorkoutPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly workoutPaymentPolicyService: WorkoutPaymentPolicyService,
    private readonly em: EntityManager,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get('access')
  @ApiOperation({
    summary: 'Get workout payment access + quoted price',
    description:
      'Returns whether the workout is paid/unlocked for the current user, and the quoted price from billing_charges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access snapshot',
    type: WorkoutPaymentAccessResponseDto,
  })
  async getAccess(
    @Param('id') workoutId: string,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<WorkoutPaymentAccessResponseDto>> {
    const workout = await this.em.findOne(
      Workout,
      { id: workoutId, isDeleted: false },
      { populate: ['trainer', 'trainee'] },
    );
    if (!workout) {
      throw new BadRequestException('Workout not found');
    }
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isTrainer = workout.trainer.id === req.user.id;
    const isTrainee = workout.trainee.id === req.user.id;
    if (!isAdmin && !isTrainer && !isTrainee) {
      throw new BadRequestException('You cannot access this workout');
    }
    const snapshot =
      await this.workoutPaymentPolicyService.getWorkoutPaymentAccessSnapshot({
        workoutId,
      });
    const view: 'LIMITED' | 'FULL' =
      isTrainee && !snapshot.isPaid ? 'LIMITED' : 'FULL';
    return BaseResponseDto.ok({
      isPaid: snapshot.isPaid,
      view,
      billingChargeId: snapshot.billingChargeId,
      amountCents: snapshot.amountCents,
      currency: snapshot.currency,
    });
  }

  @Roles(UserRole.TRAINEE)
  @Post('intent')
  @ApiOperation({
    summary: 'Create a Stripe PaymentIntent for a workout',
    description:
      'Creates a PaymentIntent for the latest ACTIVE billing charge of the workout and returns its client_secret.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created',
    type: CreateWorkoutPaymentIntentResponseDto,
  })
  async createIntent(
    @Param('id') workoutId: string,
    @Req() req: CurrentRequestUser,
  ): Promise<BaseResponseDto<CreateWorkoutPaymentIntentResponseDto>> {
    const result = await this.paymentsService.createWorkoutPaymentIntent({
      workoutId,
      traineeId: req.user.id,
    });
    return BaseResponseDto.ok(result);
  }
}
