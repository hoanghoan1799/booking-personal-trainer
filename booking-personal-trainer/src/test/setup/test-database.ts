import { EntityManager, MikroORM } from '@mikro-orm/core';

// Entities
import { BillingCharge } from '../../modules/billing/entities/billing-charge.entity';
import { Booking } from '../../modules/booking/entities/booking.entity';
import { BookingSeries } from '../../modules/booking/entities/booking-series.entity';
import { Exercise } from '../../modules/exercise/entities/exercise.entity';
import { ProcessedWebhookEvent } from '../../modules/payments/entities/processed-webhook-event.entity';
import { Payment } from '../../modules/payments/entities/payment.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { ExerciseTemplate } from '../../modules/templates/entities/exercise-template.entity';
import { ExerciseTemplateItem } from '../../modules/templates/entities/exercise-template-item.entity';
import { TrainerAvailability } from '../../modules/trainer-scheduling/entities/trainer-availability.entity';
import { TrainerTimeOff } from '../../modules/trainer-scheduling/entities/trainer-time-off.entity';
import { User } from '../../modules/user/entities/user.entity';
import { UserProvider } from '../../modules/user/entities/user-provider.entity';
import { Workout } from '../../modules/workout/entities/workout.entity';
import { WorkoutExercise } from '../../modules/workout/entities/workout-exercise.entity';

const CLEAR_ORDER: (new () => object)[] = [
  WorkoutExercise,
  Workout,
  ExerciseTemplateItem,
  ExerciseTemplate,
  Payment,
  ProcessedWebhookEvent,
  BillingCharge,
  Notification,
  Booking,
  BookingSeries,
  TrainerTimeOff,
  TrainerAvailability,
  UserProvider,
  Exercise,
  User,
];

/**
 * Removes all application rows in FK-safe order. Keeps migration history intact.
 * Use a dedicated test database (see e2e README in test-app.factory).
 */
export async function cleanDatabase(orm: MikroORM | undefined): Promise<void> {
  if (orm == null) {
    return;
  }
  const em: EntityManager = orm.em.fork();
  await em.transactional(async (tx: EntityManager) => {
    for (const entity of CLEAR_ORDER) {
      await tx.nativeDelete(entity, {});
    }
  });
}

/**
 * Ensures the schema matches migrations (same as production bootstrap).
 */
export async function runMigrations(orm: MikroORM): Promise<void> {
  await orm.migrator.up();
}
