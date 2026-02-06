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

// Entities
import { Workout } from './entities/workout.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';

// Services
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercise/exercise.service';
import { WorkoutsQueryDto } from './dtos/query-workout.dto';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: EntityRepository<Workout>,
    private readonly userService: UserService,
    private readonly exerciseService: ExerciseService,
    private readonly em: EntityManager,
  ) {}
  async create(trainerId: string, dto: CreateWorkoutDto) {
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

      const workoutExercises = dto.exerciseIds.map((exerciseId, index) =>
        em.create(WorkoutExercise, {
          workout,
          exercise: exercises.find((e) => e.id === exerciseId)!,
          order: index + 1,
          isCompleted: false,
          isDeleted: false,
        }),
      );

      const response = [workout, ...workoutExercises];

      em.persist(response);

      await em.flush();

      return { data: response };
    });
  }

  async getAll(query: WorkoutsQueryDto) {
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
      populate: ['trainer', 'trainee'],
    });

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} workout`;
  }

  remove(id: string) {
    return `This action removes a #${id} workout`;
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
