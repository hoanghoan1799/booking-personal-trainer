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
}
