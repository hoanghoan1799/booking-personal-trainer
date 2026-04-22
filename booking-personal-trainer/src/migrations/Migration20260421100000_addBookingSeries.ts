import { Migration } from '@mikro-orm/migrations';

export class Migration20260421100000_addBookingSeries extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "booking_series" (
        "id" uuid not null,
        "created_at" timestamptz null,
        "updated_at" timestamptz null,
        "trainer_id" uuid not null,
        "trainee_id" uuid not null,
        "start_date" timestamptz not null,
        "end_date" timestamptz not null,
        "start_clock_time" text not null,
        "end_clock_time" text not null,
        "period" text not null,
        constraint "booking_series_pkey" primary key ("id"),
        constraint "booking_series_trainer_id_foreign" foreign key ("trainer_id") references "users" ("id") on update cascade on delete restrict,
        constraint "booking_series_trainee_id_foreign" foreign key ("trainee_id") references "users" ("id") on update cascade on delete restrict
      );
    `);
    this.addSql(`create index if not exists "booking_series_trainer_id_index" on "booking_series" ("trainer_id");`);
    this.addSql(`create index if not exists "booking_series_trainee_id_index" on "booking_series" ("trainee_id");`);

    this.addSql(`alter table "bookings" add column if not exists "series_id" uuid null;`);
    this.addSql(
      `
      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'bookings_series_id_foreign'
        ) then
          alter table "bookings"
          add constraint "bookings_series_id_foreign"
          foreign key ("series_id")
          references "booking_series" ("id")
          on update cascade
          on delete set null;
        end if;
      end $$;
      `,
    );
    this.addSql(`create index if not exists "bookings_series_id_index" on "bookings" ("series_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "bookings" drop constraint if exists "bookings_series_id_foreign";`);
    this.addSql(`alter table "bookings" drop column if exists "series_id";`);
    this.addSql(`drop table if exists "booking_series";`);
  }
}

