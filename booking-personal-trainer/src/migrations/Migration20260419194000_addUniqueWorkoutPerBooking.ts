import { Migration } from '@mikro-orm/migrations';

export class Migration20260419194000_addUniqueWorkoutPerBooking extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      with "ranked_workouts" as (
        select
          "id",
          "booking_id",
          row_number() over (
            partition by "booking_id"
            order by "created_at" desc, "id" desc
          ) as "row_number"
        from "workouts"
        where "booking_id" is not null and "is_deleted" = false
      )
      update "workouts"
      set "is_deleted" = true,
          "deleted_at" = current_timestamp
      where "id" in (
        select "id"
        from "ranked_workouts"
        where "row_number" > 1
      );
    `);
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

