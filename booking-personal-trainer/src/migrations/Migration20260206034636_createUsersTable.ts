import { Migration } from '@mikro-orm/migrations';

export class Migration20260206034636_createUsersTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "exercise" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "description" text not null, "muscle_group" text check ("muscle_group" in ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE')) not null, "equipment" text check ("equipment" in ('BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT')) not null, "video_url" varchar(255) null, "thumbnail_url" varchar(255) null, constraint "exercise_pkey" primary key ("id"));`);

    this.addSql(`drop table if exists "refresh_tokens" cascade;`);

    this.addSql(`alter table "users" alter column "role" type text using ("role"::text);`);
    this.addSql(`alter table "users" alter column "role" set default 'TRAINEE';`);
    this.addSql(`alter table "users" alter column "approval_status" drop default;`);
    this.addSql(`alter table "users" alter column "approval_status" type text using ("approval_status"::text);`);
    this.addSql(`alter table "users" alter column "status" drop default;`);
    this.addSql(`alter table "users" alter column "status" type text using ("status"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "refresh_tokens" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "token" varchar(255) not null, "expires_at" timestamptz not null, "is_revoked" boolean not null default false, constraint "refresh_tokens_pkey" primary key ("id"));`);
    this.addSql(`alter table "refresh_tokens" add constraint "refresh_tokens_token_unique" unique ("token");`);

    this.addSql(`alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`drop table if exists "exercise" cascade;`);

    this.addSql(`alter table "users" alter column "role" drop default;`);
    this.addSql(`alter table "users" alter column "role" type text using ("role"::text);`);
    this.addSql(`alter table "users" alter column "approval_status" type text using ("approval_status"::text);`);
    this.addSql(`alter table "users" alter column "approval_status" set default 'NONE';`);
    this.addSql(`alter table "users" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "users" alter column "status" set default 'ACTIVE';`);
  }

}
