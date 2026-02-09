import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { WorkoutStatus } from '../../common/enums/workout/workout.enum';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { SuccessMessageResponse } from '../../common/interfaces/success-message-response.interface';

// Entities
import { Workout } from './entities/workout.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutResponseDto } from './dtos/workout-response.dto';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { WorkoutsQueryDto } from './dtos/query-workout.dto';

// Services
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercise/exercise.service';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: EntityRepository<Workout>,
    private readonly userService: UserService,
    private readonly exerciseService: ExerciseService,
    private readonly em: EntityManager,
  ) {}
  async create(trainerId: string, dto: CreateWorkoutDto): Promise<Workout> {
    return this.em.transactional(async (em) => {
      const trainer = await this.userService.findById(trainerId);
      const trainee = await this.userService.findById(dto.traineeId);

      const workout = em.create(Workout, {
        trainer,
        trainee,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: WorkoutStatus.PENDING,
      });

      const exercises = await this.exerciseService.findByIds(dto.exerciseIds);

      if (exercises.length !== dto.exerciseIds.length) {
        throw new BadRequestException(ERROR_MESSAGES.WORKOUT.INVALID_EXERCISES);
      }

      dto.exerciseIds.forEach((exerciseId, index) => {
        const exercise = exercises.find((ex) => ex.id === exerciseId)!;

        const workoutExercise = em.create(WorkoutExercise, {
          workout,
          exercise,
          order: index + 1,
          isCompleted: false,
          isDeleted: false,
        });

        workout.exercises.add(workoutExercise);
      });

      await em.persist(workout).flush();

      return workout;
    });
  }

  async getAll(
    query: WorkoutsQueryDto,
  ): Promise<BaseResponseDto<WorkoutResponseDto[]>> {
    const { page = 1, limit = 20, trainerId, traineeId, status } = query;

    const offset = (page - 1) * limit;

    const where: FilterQuery<Workout> = {
      isDeleted: false,
    };

    if (trainerId) {
      where.trainer = trainerId;
    }

    if (traineeId) {
      where.trainee = traineeId;
    }

    if (status) {
      where.status = status;
    }

    const [data, totalItems] = await this.workoutRepo.findAndCount(where, {
      limit,
      offset,
      orderBy: { createdAt: 'desc' },
      populate: ['trainer', 'trainee', 'exercises', 'exercises.exercise'],
    });

    const mappedData: WorkoutResponseDto[] = data.map((workout) => ({
      id: workout.id,
      startTime: workout.startTime,
      endTime: workout.endTime,
      status: workout.status,
      trainer: workout.trainer,
      trainee: workout.trainee,
      totalExercises: workout.exercises.getItems().length,
      completedExercises: workout.exercises
        .getItems()
        .filter((we) => we.isCompleted).length,
      exercises: workout.exercises.getItems().map((we) => ({
        order: we.order,
        isCompleted: we.isCompleted,
        exercise: we.exercise,
      })),
    }));

    return BaseResponseDto.okWithPagination(mappedData, {
      page,
      limit,
      totalItems,
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} workout`;
  }

  async removeAll(): Promise<SuccessMessageResponse> {
    await this.em.nativeDelete('WorkoutExercise', {});

    const count = await this.em.nativeDelete('Workout', {});

    return { message: `Deleted ${count} workouts` };
  }

  async softDelete(id: string) {
    const workout = await this.workoutRepo.findOne({
      id,
      isDeleted: false,
    });

    if (!workout) {
      throw new NotFoundException(ERROR_MESSAGES.WORKOUT.NOT_FOUND);
    }

    workout.isDeleted = true;
    workout.deletedAt = new Date();

    await this.em.flush();
  }
}
