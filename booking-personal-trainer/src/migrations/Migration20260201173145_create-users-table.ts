import { Migration } from '@mikro-orm/migrations';

export class Migration20260201173145_create-users-table extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "role" text check ("role" in ('ADMIN', 'TRAINER', 'TRAINEE')) not null, "user_type" text check ("user_type" in ('TRAINER', 'TRAINEE')) not null, "approval_status" text check ("approval_status" in ('NONE', 'PENDING', 'APPROVED', 'REJECTED')) not null default 'NONE', "status" text check ("status" in ('ACTIVE', 'INACTIVE', 'SUSPENDED')) not null default 'ACTIVE', "age" int null, "height" int null, "weight" int null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_user_name_unique" unique ("user_name");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "refresh_tokens" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "token" varchar(255) not null, "expires_at" timestamptz not null, "is_revoked" boolean not null default false, constraint "refresh_tokens_pkey" primary key ("id"));`);
    this.addSql(`alter table "refresh_tokens" add constraint "refresh_tokens_token_unique" unique ("token");`);

    this.addSql(`create table "bookings" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "trainer_id" uuid not null, "trainee_id" uuid not null, "status" text check ("status" in ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED')) not null default 'PENDING', "start_time" timestamptz not null, "end_time" timestamptz not null, constraint "bookings_pkey" primary key ("id"));`);

    this.addSql(`create table "workouts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "trainer_id" uuid not null, "trainee_id" uuid not null, "status" text check ("status" in ('PENDING', 'IN_PROGRESS', 'DONE')) not null default 'PENDING', "start_time" timestamptz not null, "end_time" timestamptz not null, "total_exercises" int not null default 0, "completed_exercises" int not null default 0, "progress" varchar(255) null, constraint "workouts_pkey" primary key ("id"));`);

    this.addSql(`alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "bookings" add constraint "bookings_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "bookings" add constraint "bookings_trainee_id_foreign" foreign key ("trainee_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "workouts" add constraint "workouts_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "workouts" add constraint "workouts_trainee_id_foreign" foreign key ("trainee_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "refresh_tokens" drop constraint "refresh_tokens_user_id_foreign";`);

    this.addSql(`alter table "bookings" drop constraint "bookings_trainer_id_foreign";`);

    this.addSql(`alter table "bookings" drop constraint "bookings_trainee_id_foreign";`);

    this.addSql(`alter table "workouts" drop constraint "workouts_trainer_id_foreign";`);

    this.addSql(`alter table "workouts" drop constraint "workouts_trainee_id_foreign";`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "refresh_tokens" cascade;`);

    this.addSql(`drop table if exists "bookings" cascade;`);

    this.addSql(`drop table if exists "workouts" cascade;`);
  }

}
