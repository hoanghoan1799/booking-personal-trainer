import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { UserRole } from '../../common/enums/user/user.enum';
import { BookingStatus } from '../../common/enums/booking/booking.enum';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { SuccessMessageResponse } from '../../common/interfaces/success-message-response.interface';

// Entities
import { User } from '../user/entities/user.entity';
import { Workout } from './entities/workout.entity';
import { WorkoutResponseDto } from './dtos/workout-response.dto';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { CreateBookingWorkoutDto } from './dtos/create-booking-workout.dto';
import { UpdateWorkoutDetailDto } from './dtos/update-workout-detail.dto';
import { WorkoutsQueryDto } from './dtos/query-workout.dto';

// Repositories
import {
  WorkoutRepositoryToken,
  type WorkoutRepository,
  type WorkoutFindManyFilter,
} from './repositories/workout.repository.interface';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import type { UserRepository } from '../user/repositories/user.repository.interface';
import {
  BookingRepositoryToken,
  type BookingRepository,
} from '../booking/repositories/booking.repository.interface';
import {
  TemplatesRepositoryToken,
  type TemplatesRepository,
} from '../templates/repositories/templates.repository.interface';
import { TemplateType } from '../templates/enums/template-type.enum';
import { WorkoutPaymentPolicyService } from '../payments/workout-payment-policy.service';
import { WorkoutStatus } from '../../common/enums/workout/workout.enum';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationTemplates } from '../notifications/constants/notification-template.constant';

@Injectable()
export class WorkoutService {
  constructor(
    @Inject(WorkoutRepositoryToken)
    private readonly workoutRepo: WorkoutRepository,
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    @Inject(BookingRepositoryToken)
    private readonly bookingRepo: BookingRepository,
    @Inject(TemplatesRepositoryToken)
    private readonly templatesRepo: TemplatesRepository,
    private readonly workoutPaymentPolicyService: WorkoutPaymentPolicyService,
    private readonly billingService: BillingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    trainerId: string,
    dto: CreateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const trainer = await this.userRepo.findById(trainerId);
    if (!trainer) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    const trainee = await this.userRepo.findById(dto.traineeId);
    if (!trainee) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    const workout = await this.workoutRepo.create({
      trainer,
      trainee,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      exerciseIds: dto.exerciseIds,
    });
    await this.createWorkoutBillingQuote({
      workoutId: workout.id,
      payerUserId: trainee.id,
      amountCents: dto.amountCents,
      currency: dto.currency,
    });
    await this.notificationsService.createAndPublishToUsers({
      notifications: [
        {
          recipientUserId: trainee.id,
          type: NotificationType.TraineeWorkoutCreated,
          ...NotificationTemplates.traineeWorkoutCreated({
            trainerUserName: trainer.userName,
          }),
          data: { workoutId: workout.id, trainerId: trainer.id },
        },
      ],
    });
    return this.mapWorkoutToResponseDto(workout);
  }

  async createForBookingFromTemplate(
    bookingId: string,
    dto: CreateBookingWorkoutDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<WorkoutResponseDto> {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.TRAINER
    ) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(ERROR_MESSAGES.BOOKING.NOT_FOUND);
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isTrainerOfBooking = booking.trainer.id === currentUser.id;
    if (!isAdmin && !isTrainerOfBooking) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Booking must be CONFIRMED to create workout',
      );
    }
    const template = await this.templatesRepo.findTemplateById(dto.templateId);
    if (!template || template.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    if (
      template.templateType === TemplateType.TRAINER &&
      template.createdBy.id !== currentUser.id &&
      !isAdmin
    ) {
      throw new BadRequestException(
        'Cannot use trainer template you do not own',
      );
    }
    const workout = await this.workoutRepo.createFromBookingTemplate({
      booking,
      template,
    });
    await this.createWorkoutBillingQuote({
      workoutId: workout.id,
      payerUserId: booking.trainee.id,
      amountCents: dto.amountCents,
      currency: dto.currency,
    });
    await this.notificationsService.createAndPublishToUsers({
      notifications: [
        {
          recipientUserId: booking.trainee.id,
          type: NotificationType.TraineeWorkoutCreated,
          ...NotificationTemplates.traineeWorkoutCreated({
            trainerUserName: booking.trainer.userName,
          }),
          data: { workoutId: workout.id, trainerId: booking.trainer.id },
        },
      ],
    });
    return this.mapWorkoutToResponseDto(workout);
  }

  private mapWorkoutToResponseDto(workout: Workout): WorkoutResponseDto {
    const items = workout.exercises.getItems();
    return {
      id: workout.id,
      bookingId: workout.booking?.id ?? null,
      templateId: workout.template?.id ?? null,
      startTime: workout.startTime,
      endTime: workout.endTime,
      status: workout.status,
      trainer: workout.trainer,
      trainee: workout.trainee,
      totalExercises: items.length,
      completedExercises: items.filter((we) => we.isCompleted).length,
      exercises: items.map((we) => ({
        id: we.id,
        order: we.order,
        sets: we.sets,
        reps: we.reps,
        restSeconds: we.restSeconds,
        notes: we.notes,
        isCompleted: we.isCompleted,
        exercise: we.exercise,
      })),
    };
  }

  private async mapWorkoutToResponseDtoForUser(
    workout: Workout,
    currentUser: User,
  ): Promise<WorkoutResponseDto> {
    const base = this.mapWorkoutToResponseDto(workout);
    const isWorkoutTrainee = workout.trainee.id === currentUser.id;
    if (!isWorkoutTrainee) {
      return base;
    }
    const isPaid = await this.workoutPaymentPolicyService.isWorkoutPaid({
      workoutId: workout.id,
    });
    if (isPaid) {
      return base;
    }
    return {
      ...base,
      exercises: [],
      totalExercises: undefined,
      completedExercises: undefined,
      templateId: null,
    };
  }

  private resolveWorkoutPriceCents(input: {
    readonly amountCents?: number;
  }): number {
    if (input.amountCents != null) {
      return input.amountCents;
    }
    const envValue = process.env.DEFAULT_WORKOUT_PRICE_CENTS;
    if (!envValue) {
      throw new BadRequestException('amountCents is required');
    }
    const parsed = Number(envValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException('DEFAULT_WORKOUT_PRICE_CENTS is invalid');
    }
    return parsed;
  }

  private async createWorkoutBillingQuote(input: {
    readonly workoutId: string;
    readonly payerUserId: string;
    readonly amountCents?: number;
    readonly currency?: string;
  }): Promise<void> {
    const amountCents = this.resolveWorkoutPriceCents({
      amountCents: input.amountCents,
    });
    const draft = await this.billingService.createWorkoutCharge({
      workoutId: input.workoutId,
      payerUserId: input.payerUserId,
      amountCents,
      currency: input.currency,
    });
    await this.billingService.activateCharge(draft.id);
  }

  async getAll(
    query: WorkoutsQueryDto,
    currentUser: User,
  ): Promise<BaseResponseDto<WorkoutResponseDto[]>> {
    const { page = 1, limit = 20, trainerId, traineeId, status } = query;
    const offset = (page - 1) * limit;

    const filter: WorkoutFindManyFilter = {
      isDeleted: false,
    };

    switch (currentUser.role) {
      case UserRole.ADMIN:
        if (trainerId) filter.trainerId = trainerId;
        if (traineeId) filter.traineeId = traineeId;
        break;
      case UserRole.TRAINER:
        filter.trainerId = currentUser.id;
        if (traineeId) filter.traineeId = traineeId;
        break;
      case UserRole.TRAINEE:
        filter.traineeId = currentUser.id;
        break;
      default:
        filter.traineeId = currentUser.id;
    }

    if (status) {
      filter.status = status;
    }

    const [data, totalItems] = await this.workoutRepo.findAndCount(filter, {
      limit,
      offset,
      orderBy: { createdAt: 'desc' },
    });

    const mappedData: WorkoutResponseDto[] = await Promise.all(
      data.map((workout) =>
        this.mapWorkoutToResponseDtoForUser(workout, currentUser),
      ),
    );

    return BaseResponseDto.okWithPagination(mappedData, {
      page,
      limit,
      totalItems,
    });
  }

  async getOneForUser(
    id: string,
    currentUser: User,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutRepo.findByIdWithExercises(id);
    if (!workout) {
      throw new NotFoundException(ERROR_MESSAGES.WORKOUT.NOT_FOUND);
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isTrainer = workout.trainer.id === currentUser.id;
    const isTrainee = workout.trainee.id === currentUser.id;
    if (!isAdmin && !isTrainer && !isTrainee) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }
    return this.mapWorkoutToResponseDtoForUser(workout, currentUser);
  }

  async updateDetail(
    id: string,
    dto: UpdateWorkoutDetailDto,
    currentUser: User,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutRepo.findByIdWithExercises(id);

    if (!workout) {
      throw new NotFoundException(ERROR_MESSAGES.WORKOUT.NOT_FOUND);
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isTrainerOfWorkout = workout.trainer.id === currentUser.id;

    if (!isAdmin && !isTrainerOfWorkout) {
      throw new BadRequestException(
        ERROR_MESSAGES.WORKOUT.CANNOT_UPDATE_EXERCISES,
      );
    }

    if (dto.status === WorkoutStatus.IN_PROGRESS) {
      const isPaid = await this.workoutPaymentPolicyService.isWorkoutPaid({
        workoutId: id,
      });
      if (!isPaid) {
        throw new BadRequestException('Workout must be paid before starting');
      }
    }

    const updatedWorkout = await this.workoutRepo.updateStatusAndCompletions(
      id,
      dto.status,
      dto.exerciseCompletions,
    );
    return this.mapWorkoutToResponseDtoForUser(updatedWorkout, currentUser);
  }

  async removeAll(): Promise<SuccessMessageResponse> {
    const count = await this.workoutRepo.removeAll();
    return { message: `Deleted ${count} workouts` };
  }

  async softDelete(id: string): Promise<void> {
    const workout = await this.workoutRepo.findByIdWithExercises(id);

    if (!workout) {
      throw new NotFoundException(ERROR_MESSAGES.WORKOUT.NOT_FOUND);
    }

    await this.workoutRepo.softDelete(id);
  }
}
