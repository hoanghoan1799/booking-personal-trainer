import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { Exercise } from '../entities/exercise.entity';

/** Injection token for ExerciseRepository */
export const ExerciseRepositoryToken = Symbol('ExerciseRepository');

export interface CreateExerciseData {
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface ExerciseFindManyFilter {
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  search?: string;
  isDeleted?: boolean;
}

export interface FindManyOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, SortOrder>;
}

export interface UpdateExerciseData {
  name?: string;
  description?: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  videoUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Port for exercise persistence. Implement with MikroORM, Prisma, TypeORM, etc.
 */
export interface ExerciseRepository {
  create(data: CreateExerciseData): Promise<Exercise>;
  findById(id: string): Promise<Exercise | null>;
  findAndCount(
    filter: ExerciseFindManyFilter,
    options: FindManyOptions,
  ): Promise<[Exercise[], number]>;
  findByIds(ids: string[]): Promise<Exercise[]>;
  update(id: string, data: UpdateExerciseData): Promise<Exercise>;
  save(exercise: Exercise): Promise<void>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  remove(id: string): Promise<void>;
}
