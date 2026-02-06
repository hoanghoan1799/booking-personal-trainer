import { Migration } from '@mikro-orm/migrations';

export class Migration20260206095948 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "workout_exercises" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "workout_id" uuid not null, "exercise_id" uuid not null, "order" int not null, "is_completed" boolean not null default false, "completed_at" timestamptz null, "is_deleted" boolean not null default false, constraint "workout_exercises_pkey" primary key ("id"));`);
    this.addSql(`create index "workout_exercises_workout_id_is_deleted_index" on "workout_exercises" ("workout_id", "is_deleted");`);

    this.addSql(`alter table "workout_exercises" add constraint "workout_exercises_workout_id_foreign" foreign key ("workout_id") references "workouts" ("id") on update cascade;`);
    this.addSql(`alter table "workout_exercises" add constraint "workout_exercises_exercise_id_foreign" foreign key ("exercise_id") references "exercise" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "workout_exercises" cascade;`);
  }

}
