import { Migration } from '@mikro-orm/migrations';

export class Migration20260413101338 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table "exercise_templates" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "description" text not null default '', "created_by_id" uuid not null, "template_type" text check ("template_type" in ('SYSTEM', 'TRAINER', 'PUBLIC')) not null default 'TRAINER', "parent_template_id" uuid null, "is_deleted" boolean not null default false, "deleted_at" varchar(255) null, constraint "exercise_templates_pkey" primary key ("id"));`);
    this.addSql(`create index "exercise_templates_name_is_deleted_index" on "exercise_templates" ("name", "is_deleted");`);
    this.addSql(`create index "exercise_templates_created_by_id_template_type_is_deleted_index" on "exercise_templates" ("created_by_id", "template_type", "is_deleted");`);
    this.addSql(`create table "exercise_template_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "template_id" uuid not null, "exercise_id" uuid not null, "order" int not null, "sets" int null, "reps" int null, "rest_seconds" int null, "notes" text not null default '', constraint "exercise_template_items_pkey" primary key ("id"));`);
    this.addSql(`create index "exercise_template_items_template_id_order_index" on "exercise_template_items" ("template_id", "order");`);
    this.addSql(`alter table "exercise_templates" add constraint "exercise_templates_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "exercise_templates" add constraint "exercise_templates_parent_template_id_foreign" foreign key ("parent_template_id") references "exercise_templates" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "exercise_template_items" add constraint "exercise_template_items_template_id_foreign" foreign key ("template_id") references "exercise_templates" ("id") on update cascade;`);
    this.addSql(`alter table "exercise_template_items" add constraint "exercise_template_items_exercise_id_foreign" foreign key ("exercise_id") references "exercise" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "exercise_templates" drop constraint "exercise_templates_parent_template_id_foreign";`);
    this.addSql(`alter table "exercise_template_items" drop constraint "exercise_template_items_template_id_foreign";`);
    this.addSql(`drop table if exists "exercise_templates" cascade;`);
    this.addSql(`drop table if exists "exercise_template_items" cascade;`);
  }
}

