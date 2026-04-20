import { Migration } from '@mikro-orm/migrations';

export class Migration20260419193000_addBookingNoOverlapConstraint extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create extension if not exists btree_gist;`);
    this.addSql(`
      alter table "bookings"
      add constraint "bookings_trainer_time_no_overlap"
      exclude using gist (
        "trainer_id" with =,
        tstzrange("start_time", "end_time", '[)') with &&
      )
      where ("status" in ('PENDING', 'CONFIRMED'));
    `);
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "bookings" drop constraint if exists "bookings_trainer_time_no_overlap";`,
    );
  }
}

