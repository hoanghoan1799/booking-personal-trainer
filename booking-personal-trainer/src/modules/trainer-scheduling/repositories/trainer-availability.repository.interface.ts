import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { User } from '../../user/entities/user.entity';
import { TrainerAvailability } from '../entities/trainer-availability.entity';

/** Injection token for TrainerAvailabilityRepository */
export const TrainerAvailabilityRepositoryToken = Symbol(
  'TrainerAvailabilityRepository',
);

export interface CreateTrainerAvailabilityData {
  trainer: User;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
}

export interface TrainerAvailabilityFindManyFilter {
  trainerId: string;
}

export interface FindManyOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, SortOrder>;
}

export interface TrainerAvailabilityRepository {
  create(data: CreateTrainerAvailabilityData): Promise<TrainerAvailability>;
  findById(id: string): Promise<TrainerAvailability | null>;
  findAndCount(
    filter: TrainerAvailabilityFindManyFilter,
    options: FindManyOptions,
  ): Promise<[TrainerAvailability[], number]>;
  findOverlappingForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
    excludeAvailabilityId?: string,
  ): Promise<TrainerAvailability | null>;
  findCoveringForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TrainerAvailability | null>;
  findOverlappingRangesForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TrainerAvailability[]>;
  findCoveringRanges(
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TrainerAvailability[]>;
  save(availability: TrainerAvailability): Promise<void>;
  remove(availability: TrainerAvailability): Promise<void>;
}
