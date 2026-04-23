import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EntityManager, LockMode } from '@mikro-orm/core';

// Commons
import dayjs from '../../../common/utils/date-time/utc-dayjs';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import { UserRole } from '../../../common/enums/user/user.enum';
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SuccessMessageResponse } from '../../../common/interfaces/success-message-response.interface';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

// Entities
import { User } from '../../user/entities/user.entity';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { ExerciseTemplate } from '../../templates/entities/exercise-template.entity';

// DTOs
import { WorkoutResponseDto } from '../dtos/workout-response.dto';
import { CreateWorkoutDto } from '../dtos/create-workout.dto';
import { CreateBookingWorkoutDto } from '../dtos/create-booking-workout.dto';
import { UpdateWorkoutDetailDto } from '../dtos/update-workout-detail.dto';
import { WorkoutsQueryDto } from '../dtos/query-workout.dto';

// Repositories
import {
  WorkoutRepositoryToken,
  type WorkoutRepository,
  type WorkoutFindManyFilter,
} from '../repositories/workout.repository.interface';
import { UserService } from '../../user/services/user.service';
import { BookingService } from '../../booking/services/booking.service';

import { TemplateType } from '../../templates/enums/template-type.enum';
import { WorkoutPaymentPolicyService } from '../../payments/services/workout-payment-policy.service';
import { BillingService } from '../../billing/services/billing.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { NotificationTemplates } from '../../notifications/constants/notification-template.constant';
import { EmailService } from '../../email/services/email.service';
import { EmailTemplates } from '../../email/constants/email-template.constant';

import { WorkoutConstants } from '../constants/workout.constants';
import { isUniqueViolation } from '../helpers/workout-database-error.helper';

@Injectable()
export class WorkoutService {
  private readonly logger = new Logger(WorkoutService.name);

  constructor(
    @Inject(WorkoutRepositoryToken)
    private readonly workoutRepo: WorkoutRepository,
    private readonly userService: UserService,
    private readonly bookingService: BookingService,
    private readonly workoutPaymentPolicyService: WorkoutPaymentPolicyService,
    private readonly billingService: BillingService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly em: EntityManager,
  ) {}

  async create(
    trainerId: string,
    dto: CreateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const trainer = await this.userService.findByIdOrNull(trainerId);
    if (!trainer) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    const trainee = await this.userService.findByIdOrNull(dto.traineeId);
    if (!trainee) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    const workout = await this.workoutRepo.create({
      trainer,
      trainee,
      startTime: dayjs.utc(dto.startTime).toDate(),
      endTime: dayjs.utc(dto.endTime).toDate(),
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
    const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
      /\/$/,
      '',
    );
    const workoutTitle: string = workout.template?.name ?? 'Workout';
    const workoutUrl: string = `${frontendUrl}/workouts/${workout.id}`;
    const workoutCreatedEmail = EmailTemplates.traineeWorkoutCreated({
      traineeName: trainee.userName,
      trainerName: trainer.userName,
      workoutTitle,
      workoutUrl,
    });
    await this.emailService.send({
      to: trainee.email,
      subject: workoutCreatedEmail.subject,
      text: workoutCreatedEmail.text,
      html: workoutCreatedEmail.html,
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
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const amountCents = this.resolveWorkoutPriceCents({
      amountCents: dto.amountCents,
    });
    const currency = dto.currency ?? WorkoutConstants.DefaultCurrency;
    const workout = await this.em
      .transactional(async (em: EntityManager) => {
        const booking = await em.findOne(
          Booking,
          { id: bookingId },
          {
            lockMode: LockMode.PESSIMISTIC_WRITE,
            populate: ['trainer', 'trainee'],
          },
        );
        if (!booking) {
          throw new NotFoundException(ERROR_MESSAGES.BOOKING.NOT_FOUND);
        }
        const isTrainerOfBooking = booking.trainer.id === currentUser.id;
        if (!isAdmin && !isTrainerOfBooking) {
          throw new BadRequestException(ERROR_MESSAGES.AUTH.FORBIDDEN);
        }
        if (booking.status !== BookingStatus.CONFIRMED) {
          throw new BadRequestException(
            'This Booking has been cancelled or rejected',
          );
        }
        const template = await em.findOne(
          ExerciseTemplate,
          { id: dto.templateId, isDeleted: false },
          {
            populate: [
              'createdBy',
              'items',
              'items.exercise',
              'parentTemplate',
            ],
          },
        );
        if (!template) {
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
        const created = em.create(Workout, {
          booking,
          trainer: booking.trainer,
          trainee: booking.trainee,
          template,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: WorkoutStatus.PENDING,
          isDeleted: false,
          deletedAt: null,
        });
        const items = template.items
          .getItems()
          .slice()
          .sort((a, b) => a.order - b.order);
        items.forEach((item) => {
          const workoutExercise = em.create(WorkoutExercise, {
            workout: created,
            exercise: item.exercise,
            order: item.order,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            notes: item.notes,
            isCompleted: false,
            isDeleted: false,
          });
          created.exercises.add(workoutExercise);
        });
        await em.persist(created).flush();
        await this.billingService.createAndActivateWorkoutChargeAtomic({
          em,
          workoutId: created.id,
          payerUserId: booking.trainee.id,
          amountCents,
          currency,
        });
        return created;
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err)) {
          throw new BadRequestException('Workout already exists for booking');
        }
        throw err;
      });
    try {
      const resolvedBooking =
        await this.bookingService.findBookingById(bookingId);
      if (resolvedBooking) {
        await this.notificationsService.createAndPublishToUsers({
          notifications: [
            {
              recipientUserId: resolvedBooking.trainee.id,
              type: NotificationType.TraineeWorkoutCreated,
              ...NotificationTemplates.traineeWorkoutCreated({
                trainerUserName: resolvedBooking.trainer.userName,
              }),
              data: {
                workoutId: workout.id,
                trainerId: resolvedBooking.trainer.id,
              },
            },
          ],
        });
        const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
          /\/$/,
          '',
        );
        const workoutTitle: string = workout.template?.name ?? 'Workout';
        const workoutUrl: string = `${frontendUrl}/workouts/${workout.id}`;
        const bookingWorkoutEmail = EmailTemplates.traineeWorkoutCreated({
          traineeName: resolvedBooking.trainee.userName,
          trainerName: resolvedBooking.trainer.userName,
          workoutTitle,
          workoutUrl,
        });
        await this.emailService.send({
          to: resolvedBooking.trainee.email,
          subject: bookingWorkoutEmail.subject,
          text: bookingWorkoutEmail.text,
          html: bookingWorkoutEmail.html,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Workout ${workout.id} created but side effects failed: ${message}`,
      );
    }
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
