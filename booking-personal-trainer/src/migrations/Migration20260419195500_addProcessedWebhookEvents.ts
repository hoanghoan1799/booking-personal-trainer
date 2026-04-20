import { Migration } from '@mikro-orm/migrations';

export class Migration20260419195500_addProcessedWebhookEvents extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "processed_webhook_events" (
        "id" uuid not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        "provider" varchar(255) not null,
        "event_id" varchar(255) not null,
        "received_at" timestamptz not null,
        constraint "processed_webhook_events_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `alter table "processed_webhook_events" add constraint "processed_webhook_events_provider_event_id_unique" unique ("provider", "event_id");`,
    );
    this.addSql(
      `create index "processed_webhook_events_provider_index" on "processed_webhook_events" ("provider");`,
    );
    this.addSql(
      `create index "processed_webhook_events_received_at_index" on "processed_webhook_events" ("received_at");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "processed_webhook_events" cascade;`);
  }
}

