import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

// Entity
import { TrainerTimeOff } from '../entities/trainer-time-off.entity';

// Repository port
import type {
  CreateTrainerTimeOffData,
  FindManyOptions,
  TrainerTimeOffFindManyFilter,
  TrainerTimeOffRepository,
} from './trainer-time-off.repository.interface';

@Injectable()
export class MikroOrmTrainerTimeOffRepository implements TrainerTimeOffRepository {
  constructor(
    @InjectRepository(TrainerTimeOff)
    private readonly repo: EntityRepository<TrainerTimeOff>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateTrainerTimeOffData): Promise<TrainerTimeOff> {
    const timeOff = this.repo.create({
      trainer: data.trainer,
      reason: data.reason,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    await this.em.persist(timeOff).flush();
    return timeOff;
  }

  async findById(id: string): Promise<TrainerTimeOff | null> {
    return this.repo.findOne({ id }, { populate: ['trainer'] });
  }

  /**
   * Intervals [s1, e1) and [s2, e2) overlap iff s1 < e2 && s2 < e1 (back-to-back allowed).
   */
  async findOverlappingForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
    excludeTimeOffId?: string,
  ): Promise<TrainerTimeOff | null> {
    const where: FilterQuery<TrainerTimeOff> = {
      trainer: trainerId,
      startTime: { $lt: rangeEnd },
      endTime: { $gt: rangeStart },
    };
    if (excludeTimeOffId !== undefined) {
      where.id = { $ne: excludeTimeOffId };
    }
    return this.repo.findOne(where, { populate: ['trainer'] });
  }

  async findOverlappingRangesForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TrainerTimeOff[]> {
    const where: FilterQuery<TrainerTimeOff> = {
      trainer: trainerId,
      startTime: { $lt: rangeEnd },
      endTime: { $gt: rangeStart },
    };
    return this.repo.find(where, {
      populate: ['trainer'],
      orderBy: { startTime: 'ASC' },
    });
  }

  async findAndCount(
    filter: TrainerTimeOffFindManyFilter,
    options: FindManyOptions,
  ): Promise<[TrainerTimeOff[], number]> {
    const where: FilterQuery<TrainerTimeOff> = { trainer: filter.trainerId };
    return this.repo.findAndCount(where, {
      populate: ['trainer'],
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy as Record<string, 'ASC' | 'DESC'>,
    });
  }

  async save(timeOff: TrainerTimeOff): Promise<void> {
    await this.em.persist(timeOff).flush();
  }

  async remove(timeOff: TrainerTimeOff): Promise<void> {
    await this.em.remove(timeOff).flush();
  }
}
