import { Migration } from '@mikro-orm/migrations';

const NOTIFICATION_TYPES =
  "('ADMIN_TRAINER_ROLE_REQUESTED', 'ADMIN_NEW_USER_REGISTERED', 'ADMIN_TRAINEE_BOOKED_TRAINER', 'ADMIN_TRAINEE_PAID_FOR_WORKOUT', 'TRAINER_NEW_BOOKING', 'TRAINER_BOOKING_CANCELLED_BY_TRAINEE', 'TRAINER_TRAINEE_PAID_FOR_WORKOUT', 'TRAINEE_BOOKING_APPROVED', 'TRAINEE_BOOKING_REJECTED', 'TRAINEE_BOOKING_CANCELLED_BY_TRAINER', 'TRAINEE_WORKOUT_CREATED', 'USER_ROLE_UPDATED')";

const NOTIFICATION_TYPES_PREVIOUS =
  "('ADMIN_NEW_USER_REGISTERED', 'ADMIN_TRAINEE_BOOKED_TRAINER', 'ADMIN_TRAINEE_PAID_FOR_WORKOUT', 'TRAINER_NEW_BOOKING', 'TRAINER_BOOKING_CANCELLED_BY_TRAINEE', 'TRAINER_TRAINEE_PAID_FOR_WORKOUT', 'TRAINEE_BOOKING_APPROVED', 'TRAINEE_BOOKING_REJECTED', 'TRAINEE_BOOKING_CANCELLED_BY_TRAINER', 'TRAINEE_WORKOUT_CREATED', 'USER_ROLE_UPDATED')";

export class Migration20260419180500_addAdminTrainerRoleRequestedNotificationType extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "notifications" drop constraint if exists "notifications_type_check";`,
    );
    this.addSql(
      `alter table "notifications" add constraint "notifications_type_check" check ("type" in ${NOTIFICATION_TYPES});`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "notifications" drop constraint if exists "notifications_type_check";`,
    );
    this.addSql(
      `alter table "notifications" add constraint "notifications_type_check" check ("type" in ${NOTIFICATION_TYPES_PREVIOUS});`,
    );
  }
}
