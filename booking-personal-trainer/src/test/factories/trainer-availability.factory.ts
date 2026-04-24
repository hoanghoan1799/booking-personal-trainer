import { EntityManager } from '@mikro-orm/core';

// Entities
import { TrainerAvailability } from '../../modules/trainer-scheduling/entities/trainer-availability.entity';
import { User } from '../../modules/user/entities/user.entity';

import { getIsoDayOfWeek } from '../utils/helpers';

/**
 * Inserts a row that satisfies
 * `TrainerAvailabilityRepository.findCoveringForTrainer` for the given range.
 */
export const createTestTrainerAvailability = async (
  em: EntityManager,
  input: { trainer: User; startTime: Date; endTime: Date },
): Promise<TrainerAvailability> => {
  const row: TrainerAvailability = em.create(TrainerAvailability, {
    trainer: input.trainer,
    dayOfWeek: getIsoDayOfWeek(input.startTime),
    startTime: input.startTime,
    endTime: input.endTime,
  });
  await em.persistAndFlush(row);
  return row;
};
