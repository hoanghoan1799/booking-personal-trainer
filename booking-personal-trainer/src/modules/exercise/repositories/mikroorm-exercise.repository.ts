import { Injectable } from '@nestjs/common';

import { utcNowAsDate } from '../../../common/utils/date-time/utc-date-time.helper';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { wrap } from '@mikro-orm/core';

import { Exercise } from '../entities/exercise.entity';
import {
  ExerciseRepository,
  CreateExerciseData,
  ExerciseFindManyFilter,
  FindManyOptions,
  UpdateExerciseData,
} from './exercise.repository.interface';

@Injectable()
export class MikroOrmExerciseRepository implements ExerciseRepository {
  constructor(
    @InjectRepository(Exercise)
    private readonly repo: EntityRepository<Exercise>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateExerciseData): Promise<Exercise> {
    const exercise = this.repo.create({
      name: data.name,
      description: data.description,
      muscleGroup: data.muscleGroup,
      equipment: data.equipment,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
    });
    await this.em.persist(exercise).flush();
    return exercise;
  }

  async findById(id: string): Promise<Exercise | null> {
    return this.repo.findOne({ id });
  }

  async findAndCount(
    filter: ExerciseFindManyFilter,
    options: FindManyOptions,
  ): Promise<[Exercise[], number]> {
    const where: FilterQuery<Exercise> = {
      isDeleted: filter.isDeleted ?? false,
    };
    if (filter.muscleGroup != null) {
      where.muscleGroup = filter.muscleGroup;
    }
    if (filter.equipment != null) {
      where.equipment = filter.equipment;
    }
    if (filter.search != null && filter.search.trim() !== '') {
      where.name = { $ilike: `%${filter.search}%` };
    }
    return this.repo.findAndCount(where, {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy as Record<string, 'ASC' | 'DESC'>,
    });
  }

  async findByIds(ids: string[]): Promise<Exercise[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repo.find({
      id: { $in: ids },
      isDeleted: false,
    });
  }

  async update(id: string, data: UpdateExerciseData): Promise<Exercise> {
    const exercise = await this.repo.findOne({ id });
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    wrap(exercise).assign(data, { onlyProperties: true });
    await this.em.flush();
    return exercise;
  }

  async save(exercise: Exercise): Promise<void> {
    await this.em.persist(exercise).flush();
  }

  async softDelete(id: string): Promise<boolean> {
    const exercise = await this.repo.findOne({ id, isDeleted: false });
    if (!exercise) {
      return false;
    }
    exercise.isDeleted = true;
    exercise.deletedAt = utcNowAsDate();
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const exercise = await this.repo.findOne({ id, isDeleted: true });
    if (!exercise) {
      return false;
    }
    exercise.isDeleted = false;
    exercise.deletedAt = null;
    await this.em.flush();
    return true;
  }

  async remove(id: string): Promise<void> {
    const exercise = await this.repo.findOne({ id });
    if (!exercise) {
      return;
    }
    await this.em.remove(exercise).flush();
  }
}
