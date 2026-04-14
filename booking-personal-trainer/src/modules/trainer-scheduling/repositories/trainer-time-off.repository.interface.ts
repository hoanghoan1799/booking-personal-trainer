import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { User } from '../../user/entities/user.entity';
import { TrainerTimeOff } from '../entities/trainer-time-off.entity';

/** Injection token for TrainerTimeOffRepository */
export const TrainerTimeOffRepositoryToken = Symbol('TrainerTimeOffRepository');

export interface CreateTrainerTimeOffData {
  trainer: User;
  reason: string;
  startTime: Date;
  endTime: Date;
}

export interface TrainerTimeOffFindManyFilter {
  trainerId: string;
}

export interface FindManyOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, SortOrder>;
}

export interface TrainerTimeOffRepository {
  create(data: CreateTrainerTimeOffData): Promise<TrainerTimeOff>;
  findAndCount(
    filter: TrainerTimeOffFindManyFilter,
    options: FindManyOptions,
  ): Promise<[TrainerTimeOff[], number]>;
}
