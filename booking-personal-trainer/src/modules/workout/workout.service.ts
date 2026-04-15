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

    const mappedData: WorkoutResponseDto[] = data.map((workout) =>
      this.mapWorkoutToResponseDto(workout),
    );

    return BaseResponseDto.okWithPagination(mappedData, {
      page,
      limit,
      totalItems,
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} workout`;
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

    const updatedWorkout = await this.workoutRepo.updateStatusAndCompletions(
      id,
      dto.status,
      dto.exerciseCompletions,
    );
    return this.mapWorkoutToResponseDto(updatedWorkout);
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
