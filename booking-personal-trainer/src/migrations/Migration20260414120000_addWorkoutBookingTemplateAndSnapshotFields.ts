import { Migration } from '@mikro-orm/migrations';

export class Migration20260414120000_addWorkoutBookingTemplateAndSnapshotFields extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "workouts" add column "booking_id" uuid null;`,
    );
    this.addSql(
      `alter table "workouts" add column "template_id" uuid null;`,
    );
    this.addSql(
      `create index "workouts_booking_id_index" on "workouts" ("booking_id");`,
    );
    this.addSql(
      `create index "workouts_template_id_index" on "workouts" ("template_id");`,
    );
    this.addSql(
      `alter table "workouts" add constraint "workouts_booking_id_foreign" foreign key ("booking_id") references "bookings" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "workouts" add constraint "workouts_template_id_foreign" foreign key ("template_id") references "exercise_templates" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "workout_exercises" add column "sets" int null;`,
    );
    this.addSql(
      `alter table "workout_exercises" add column "reps" int null;`,
    );
    this.addSql(
      `alter table "workout_exercises" add column "rest_seconds" int null;`,
    );
    this.addSql(
      `alter table "workout_exercises" add column "notes" text not null default '';`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "workouts" drop constraint "workouts_template_id_foreign";`,
    );
    this.addSql(
      `alter table "workouts" drop constraint "workouts_booking_id_foreign";`,
    );
    this.addSql(`drop index "workouts_template_id_index";`);
    this.addSql(`drop index "workouts_booking_id_index";`);
    this.addSql(`alter table "workouts" drop column "template_id";`);
    this.addSql(`alter table "workouts" drop column "booking_id";`);
    this.addSql(`alter table "workout_exercises" drop column "notes";`);
    this.addSql(`alter table "workout_exercises" drop column "rest_seconds";`);
    this.addSql(`alter table "workout_exercises" drop column "reps";`);
    this.addSql(`alter table "workout_exercises" drop column "sets";`);
  }
}

