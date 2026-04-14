import { Migration } from '@mikro-orm/migrations';

export class Migration20260414090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "trainer_availabilities" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "trainer_id" uuid not null, "day_of_week" int not null, "start_time" timestamptz not null, "end_time" timestamptz not null, constraint "trainer_availabilities_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "trainer_availabilities_trainer_id_day_of_week_index" on "trainer_availabilities" ("trainer_id", "day_of_week");`,
    );
    this.addSql(
      `alter table "trainer_availabilities" add constraint "trainer_availabilities_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `create table "trainer_time_offs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "trainer_id" uuid not null, "reason" varchar(255) not null, "start_time" timestamptz not null, "end_time" timestamptz not null, constraint "trainer_time_offs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "trainer_time_offs_trainer_id_start_time_end_time_index" on "trainer_time_offs" ("trainer_id", "start_time", "end_time");`,
    );
    this.addSql(
      `alter table "trainer_time_offs" add constraint "trainer_time_offs_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "trainer_availabilities" cascade;`);
    this.addSql(`drop table if exists "trainer_time_offs" cascade;`);
  }
}

