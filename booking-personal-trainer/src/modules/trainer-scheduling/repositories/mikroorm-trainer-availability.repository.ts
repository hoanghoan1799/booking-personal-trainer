import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

// Entity
import { TrainerAvailability } from '../entities/trainer-availability.entity';

// Repository port
import type {
  CreateTrainerAvailabilityData,
  FindManyOptions,
  TrainerAvailabilityFindManyFilter,
  TrainerAvailabilityRepository,
} from './trainer-availability.repository.interface';

@Injectable()
export class MikroOrmTrainerAvailabilityRepository implements TrainerAvailabilityRepository {
  constructor(
    @InjectRepository(TrainerAvailability)
    private readonly repo: EntityRepository<TrainerAvailability>,
    private readonly em: EntityManager,
  ) {}

  async create(
    data: CreateTrainerAvailabilityData,
  ): Promise<TrainerAvailability> {
    const availability = this.repo.create({
      trainer: data.trainer,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    await this.em.persist(availability).flush();
    return availability;
  }

  async findById(id: string): Promise<TrainerAvailability | null> {
    return this.repo.findOne({ id }, { populate: ['trainer'] });
  }

  async findAndCount(
    filter: TrainerAvailabilityFindManyFilter,
    options: FindManyOptions,
  ): Promise<[TrainerAvailability[], number]> {
    const where: FilterQuery<TrainerAvailability> = {
      trainer: filter.trainerId,
    };
    return this.repo.findAndCount(where, {
      populate: ['trainer'],
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy as Record<string, 'ASC' | 'DESC'>,
    });
  }

  async save(availability: TrainerAvailability): Promise<void> {
    await this.em.persist(availability).flush();
  }

  async remove(availability: TrainerAvailability): Promise<void> {
    await this.em.remove(availability).flush();
  }
}
