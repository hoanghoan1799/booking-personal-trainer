import { Migration } from '@mikro-orm/migrations';

export class Migration20260419195000_addPaymentIdempotencyAndNullableIntent extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "payments" add column "idempotency_key" text null;`);
    this.addSql(
      `alter table "payments" alter column "provider_payment_intent_id" drop not null;`,
    );
    this.addSql(`
      create unique index if not exists "payments_provider_idempotency_key_unique"
      on "payments" ("provider", "idempotency_key")
      where ("idempotency_key" is not null);
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "payments_provider_idempotency_key_unique";`);
    this.addSql(
      `alter table "payments" alter column "provider_payment_intent_id" set not null;`,
    );
    this.addSql(`alter table "payments" drop column "idempotency_key";`);
  }
}

