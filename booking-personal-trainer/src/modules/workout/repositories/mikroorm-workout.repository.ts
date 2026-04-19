import { Inject, Injectable } from '@nestjs/common';

import { utcNowAsDate } from '../../../common/utils/date-time/utc-date-time.helper';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { Workout } from '../entities/workout.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import {
  ExerciseRepositoryToken,
  type ExerciseRepository,
} from '../../exercise/repositories/exercise.repository.interface';
import {
  WorkoutRepository,
  CreateWorkoutData,
  CreateWorkoutFromBookingTemplateData,
  WorkoutFindManyFilter,
  FindManyWorkoutOptions,
  ExerciseCompletionItem,
} from './workout.repository.interface';
import { ExerciseTemplateItem } from '../../templates/entities/exercise-template-item.entity';

@Injectable()
export class MikroOrmWorkoutRepository implements WorkoutRepository {
  constructor(
    @InjectRepository(Workout)
    private readonly repo: EntityRepository<Workout>,
    private readonly em: EntityManager,
    @Inject(ExerciseRepositoryToken)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async create(data: CreateWorkoutData): Promise<Workout> {
    return this.em.transactional(async (em) => {
      const workout = em.create(Workout, {
        trainer: data.trainer,
        trainee: data.trainee,
        startTime: data.startTime,
        endTime: data.endTime,
        status: WorkoutStatus.PENDING,
      });
      const exercises = await this.exerciseRepository.findByIds(
        data.exerciseIds,
      );
      if (exercises.length !== data.exerciseIds.length) {
        throw new Error('Invalid exercise ids');
      }
      data.exerciseIds.forEach((exerciseId, index) => {
        const exercise = exercises.find((ex) => ex.id === exerciseId)!;
        const workoutExercise = em.create(WorkoutExercise, {
          workout,
          exercise,
          order: index + 1,
          sets: null,
          reps: null,
          restSeconds: null,
          notes: '',
          isCompleted: false,
          isDeleted: false,
        });
        workout.exercises.add(workoutExercise);
      });
      await em.persist(workout).flush();
      return workout;
    });
  }

  async createFromBookingTemplate(
    data: CreateWorkoutFromBookingTemplateData,
  ): Promise<Workout> {
    return this.em.transactional(async (em) => {
      const workout = em.create(Workout, {
        booking: data.booking,
        trainer: data.booking.trainer,
        trainee: data.booking.trainee,
        template: data.template,
        startTime: data.booking.startTime,
        endTime: data.booking.endTime,
        status: WorkoutStatus.PENDING,
      });
      const items = data.template.items
        .getItems()
        .slice()
        .sort(
          (a: ExerciseTemplateItem, b: ExerciseTemplateItem) =>
            a.order - b.order,
        );
      items.forEach((item: ExerciseTemplateItem) => {
        const workoutExercise = em.create(WorkoutExercise, {
          workout,
          exercise: item.exercise,
          order: item.order,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          notes: item.notes,
          isCompleted: false,
          isDeleted: false,
        });
        workout.exercises.add(workoutExercise);
      });
      await em.persist(workout).flush();
      return workout;
    });
  }

  async findFirstByBookingId(bookingId: string): Promise<Workout | null> {
    return this.repo.findOne(
      { booking: bookingId, isDeleted: false },
      { populate: ['booking', 'trainer', 'trainee'] },
    );
  }

  async findByIdWithExercises(id: string): Promise<Workout | null> {
    return this.repo.findOne(
      { id, isDeleted: false },
      {
        populate: [
          'booking',
          'template',
          'trainer',
          'trainee',
          'exercises',
          'exercises.exercise',
        ],
      },
    );
  }

  async findAndCount(
    filter: WorkoutFindManyFilter,
    options: FindManyWorkoutOptions,
  ): Promise<[Workout[], number]> {
    const where: FilterQuery<Workout> = {
      isDeleted: filter.isDeleted ?? false,
    };
    if (filter.trainerId != null) {
      where.trainer = filter.trainerId;
    }
    if (filter.traineeId != null) {
      where.trainee = filter.traineeId;
    }
    if (filter.status != null) {
      where.status = filter.status;
    }
    return this.repo.findAndCount(where, {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy,
      populate: [
        'booking',
        'template',
        'trainer',
        'trainee',
        'exercises',
        'exercises.exercise',
      ],
    });
  }

  async save(workout: Workout): Promise<void> {
    await this.em.persist(workout).flush();
  }

  async updateStatusAndCompletions(
    id: string,
    status?: WorkoutStatus,
    exerciseCompletions?: ExerciseCompletionItem[],
  ): Promise<Workout> {
    const workout = await this.repo.findOne(
      { id, isDeleted: false },
      {
        populate: [
          'booking',
          'template',
          'trainer',
          'trainee',
          'exercises',
          'exercises.exercise',
        ],
      },
    );
    if (!workout) {
      throw new Error('Workout not found');
    }
    if (status != null) {
      workout.status = status;
    }
    if (exerciseCompletions != null && exerciseCompletions.length > 0) {
      const items = workout.exercises.getItems();
      exerciseCompletions.forEach(({ workoutExerciseId, isCompleted }) => {
        const we = items.find((e) => e.id === workoutExerciseId);
        if (we) {
          we.isCompleted = isCompleted;
          we.completedAt = isCompleted ? utcNowAsDate() : undefined;
        }
      });
    }
    await this.em.flush();
    return workout;
  }

  async softDelete(id: string): Promise<void> {
    const workout = await this.repo.findOne({ id, isDeleted: false });
    if (!workout) {
      return;
    }
    workout.isDeleted = true;
    workout.deletedAt = utcNowAsDate();
    await this.em.flush();
  }

  async removeAll(): Promise<number> {
    await this.em.nativeDelete('WorkoutExercise', {});
    const count = await this.em.nativeDelete('Workout', {});
    return count;
  }
}
