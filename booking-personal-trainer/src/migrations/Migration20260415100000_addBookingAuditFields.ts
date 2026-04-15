import { Migration } from '@mikro-orm/migrations';

export class Migration20260415100000_addBookingAuditFields extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "bookings" add column "status_changed_at" timestamptz null;`);
    this.addSql(`alter table "bookings" add column "cancelled_by" uuid null;`);
    this.addSql(`alter table "bookings" add column "cancellation_reason" text null;`);
    this.addSql(`alter table "bookings" add column "rejection_reason" text null;`);
    this.addSql(
      `alter table "bookings" add constraint "bookings_cancelled_by_foreign" foreign key ("cancelled_by") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(`create index "bookings_status_index" on "bookings" ("status");`);
    this.addSql(`create index "bookings_trainer_id_start_time_index" on "bookings" ("trainer_id", "start_time");`);
    this.addSql(`create index "bookings_trainee_id_start_time_index" on "bookings" ("trainee_id", "start_time");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "bookings_trainee_id_start_time_index";`);
    this.addSql(`drop index "bookings_trainer_id_start_time_index";`);
    this.addSql(`drop index "bookings_status_index";`);
    this.addSql(`alter table "bookings" drop constraint "bookings_cancelled_by_foreign";`);
    this.addSql(`alter table "bookings" drop column "rejection_reason";`);
    this.addSql(`alter table "bookings" drop column "cancellation_reason";`);
    this.addSql(`alter table "bookings" drop column "cancelled_by";`);
    this.addSql(`alter table "bookings" drop column "status_changed_at";`);
  }
}

