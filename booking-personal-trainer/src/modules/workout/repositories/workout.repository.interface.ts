import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { User } from '../../user/entities/user.entity';
import { Workout } from '../entities/workout.entity';

/** Injection token for WorkoutRepository */
export const WorkoutRepositoryToken = Symbol('WorkoutRepository');

export interface CreateWorkoutData {
  trainer: User;
  trainee: User;
  startTime: Date;
  endTime: Date;
  exerciseIds: string[];
}

export interface WorkoutFindManyFilter {
  trainerId?: string;
  traineeId?: string;
  status?: WorkoutStatus;
  isDeleted?: boolean;
}

export interface FindManyWorkoutOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export interface ExerciseCompletionItem {
  workoutExerciseId: string;
  isCompleted: boolean;
}

/**
 * Port for workout persistence. Implement with MikroORM, Prisma, TypeORM, etc.
 */
export interface WorkoutRepository {
  create(data: CreateWorkoutData): Promise<Workout>;
  findByIdWithExercises(id: string): Promise<Workout | null>;
  findAndCount(
    filter: WorkoutFindManyFilter,
    options: FindManyWorkoutOptions,
  ): Promise<[Workout[], number]>;
  save(workout: Workout): Promise<void>;
  updateStatusAndCompletions(
    id: string,
    status?: WorkoutStatus,
    exerciseCompletions?: ExerciseCompletionItem[],
  ): Promise<Workout>;
  softDelete(id: string): Promise<void>;
  removeAll(): Promise<number>;
}
