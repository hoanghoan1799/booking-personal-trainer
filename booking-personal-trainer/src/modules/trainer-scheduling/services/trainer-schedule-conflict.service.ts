import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

import {
  TrainerAvailabilityRepositoryToken,
  type TrainerAvailabilityRepository,
} from '../repositories/trainer-availability.repository.interface';
import {
  TrainerTimeOffRepositoryToken,
  type TrainerTimeOffRepository,
} from '../repositories/trainer-time-off.repository.interface';

type AssertNoScheduleOverlapInput = {
  readonly trainerId: string;
  readonly start: Date;
  readonly end: Date;
  readonly excludeAvailabilityId?: string;
  readonly excludeTimeOffId?: string;
};

/**
 * Ensures no availability or time off interval overlaps the given range for a trainer.
 * Intervals use half-open semantics: [start, end); overlap iff s1 < e2 && s2 < e1 (touching endpoints allowed).
 */
@Injectable()
export class TrainerScheduleConflictService {
  constructor(
    @Inject(TrainerAvailabilityRepositoryToken)
    private readonly availabilityRepo: TrainerAvailabilityRepository,
    @Inject(TrainerTimeOffRepositoryToken)
    private readonly timeOffRepo: TrainerTimeOffRepository,
  ) {}

  async assertNoOverlap(input: AssertNoScheduleOverlapInput): Promise<void> {
    const conflictingAvailability =
      await this.availabilityRepo.findOverlappingForTrainer(
        input.trainerId,
        input.start,
        input.end,
        input.excludeAvailabilityId,
      );
    if (conflictingAvailability !== null) {
      throw new BadRequestException(
        ERROR_MESSAGES.TRAINER.SCHEDULE_SLOT_OVERLAP,
      );
    }
    const conflictingTimeOff = await this.timeOffRepo.findOverlappingForTrainer(
      input.trainerId,
      input.start,
      input.end,
      input.excludeTimeOffId,
    );
    if (conflictingTimeOff !== null) {
      throw new BadRequestException(
        ERROR_MESSAGES.TRAINER.SCHEDULE_SLOT_OVERLAP,
      );
    }
  }
}
