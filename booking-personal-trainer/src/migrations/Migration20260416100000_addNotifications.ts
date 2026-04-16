import { Migration } from '@mikro-orm/migrations';

export class Migration20260416100000_addNotifications extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "notifications" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "recipient_id" uuid not null, "type" text check ("type" in ('ADMIN_NEW_USER_REGISTERED', 'ADMIN_TRAINEE_BOOKED_TRAINER', 'ADMIN_TRAINEE_PAID_FOR_WORKOUT', 'TRAINER_NEW_BOOKING', 'TRAINER_BOOKING_CANCELLED_BY_TRAINEE', 'TRAINER_TRAINEE_PAID_FOR_WORKOUT', 'TRAINEE_BOOKING_APPROVED', 'TRAINEE_BOOKING_REJECTED', 'TRAINEE_BOOKING_CANCELLED_BY_TRAINER', 'TRAINEE_WORKOUT_CREATED', 'USER_ROLE_UPDATED')) not null, "title" text not null, "message" text not null, "data" jsonb null, "is_read" boolean not null default false, constraint "notifications_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "notifications_recipient_id_index" on "notifications" ("recipient_id");`,
    );
    this.addSql(
      `create index "notifications_is_read_index" on "notifications" ("is_read");`,
    );
    this.addSql(
      `create index "notifications_type_index" on "notifications" ("type");`,
    );
    this.addSql(
      `create index "notifications_created_at_index" on "notifications" ("created_at");`,
    );
    this.addSql(
      `alter table "notifications" add constraint "notifications_recipient_id_foreign" foreign key ("recipient_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "notifications" drop constraint "notifications_recipient_id_foreign";`,
    );
    this.addSql(`drop index "notifications_created_at_index";`);
    this.addSql(`drop index "notifications_type_index";`);
    this.addSql(`drop index "notifications_is_read_index";`);
    this.addSql(`drop index "notifications_recipient_id_index";`);
    this.addSql(`drop table if exists "notifications" cascade;`);
  }
}

