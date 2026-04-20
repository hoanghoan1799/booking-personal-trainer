import { Migration } from '@mikro-orm/migrations';

export class Migration20260419194000_addUniqueWorkoutPerBooking extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create unique index if not exists "workouts_booking_id_unique_active"
      on "workouts" ("booking_id")
      where ("booking_id" is not null and "is_deleted" = false);
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "workouts_booking_id_unique_active";`);
  }
}

