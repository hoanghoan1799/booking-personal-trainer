import { Migration } from '@mikro-orm/migrations';

export class Migration20260211092713_initDatabase extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "exercise" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "description" text not null, "muscle_group" text check ("muscle_group" in ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE')) not null, "equipment" text check ("equipment" in ('BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT')) not null, "video_url" varchar(255) null, "thumbnail_url" varchar(255) null, "is_deleted" boolean not null default false, "deleted_at" varchar(255) null, constraint "exercise_pkey" primary key ("id"));`);
    this.addSql(`create index "exercise_is_deleted_index" on "exercise" ("is_deleted");`);

    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "role" text check ("role" in ('ADMIN', 'TRAINER', 'TRAINEE')) not null default 'TRAINEE', "user_type" text check ("user_type" in ('TRAINER', 'TRAINEE')) not null, "approval_status" text check ("approval_status" in ('NONE', 'PENDING', 'APPROVED', 'REJECTED')) not null, "status" text check ("status" in ('ACTIVE', 'INACTIVE', 'SUSPENDED')) not null, "age" int null, "height" int null, "weight" int null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_user_name_unique" unique ("user_name");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "bookings" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "trainer_id" uuid not null, "trainee_id" uuid not null, "status" text check ("status" in ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED')) not null default 'PENDING', "start_time" timestamptz not null, "end_time" timestamptz not null, constraint "bookings_pkey" primary key ("id"));`);

    this.addSql(`create table "workouts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "trainer_id" uuid not null, "trainee_id" uuid not null, "status" text check ("status" in ('PENDING', 'IN_PROGRESS', 'DONE')) not null default 'PENDING', "start_time" timestamptz not null, "end_time" timestamptz not null, "is_deleted" boolean not null default false, "deleted_at" varchar(255) null, constraint "workouts_pkey" primary key ("id"));`);
    this.addSql(`create index "workouts_start_time_index" on "workouts" ("start_time");`);
    this.addSql(`create index "workouts_trainee_id_is_deleted_index" on "workouts" ("trainee_id", "is_deleted");`);
    this.addSql(`create index "workouts_trainer_id_is_deleted_index" on "workouts" ("trainer_id", "is_deleted");`);

    this.addSql(`create table "workout_exercises" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "workout_id" uuid not null, "exercise_id" uuid not null, "order" int not null, "is_completed" boolean not null default false, "completed_at" timestamptz null, "is_deleted" boolean not null default false, constraint "workout_exercises_pkey" primary key ("id"));`);
    this.addSql(`create index "workout_exercises_workout_id_is_deleted_index" on "workout_exercises" ("workout_id", "is_deleted");`);

    this.addSql(`alter table "bookings" add constraint "bookings_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "bookings" add constraint "bookings_trainee_id_foreign" foreign key ("trainee_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "workouts" add constraint "workouts_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "workouts" add constraint "workouts_trainee_id_foreign" foreign key ("trainee_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "workout_exercises" add constraint "workout_exercises_workout_id_foreign" foreign key ("workout_id") references "workouts" ("id") on update cascade;`);
    this.addSql(`alter table "workout_exercises" add constraint "workout_exercises_exercise_id_foreign" foreign key ("exercise_id") references "exercise" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "workout_exercises" drop constraint "workout_exercises_exercise_id_foreign";`);

    this.addSql(`alter table "bookings" drop constraint "bookings_trainer_id_foreign";`);

    this.addSql(`alter table "bookings" drop constraint "bookings_trainee_id_foreign";`);

    this.addSql(`alter table "workouts" drop constraint "workouts_trainer_id_foreign";`);

    this.addSql(`alter table "workouts" drop constraint "workouts_trainee_id_foreign";`);

    this.addSql(`alter table "workout_exercises" drop constraint "workout_exercises_workout_id_foreign";`);

    this.addSql(`drop table if exists "exercise" cascade;`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "bookings" cascade;`);

    this.addSql(`drop table if exists "workouts" cascade;`);

    this.addSql(`drop table if exists "workout_exercises" cascade;`);
  }

}
