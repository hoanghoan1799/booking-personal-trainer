import { Migration } from '@mikro-orm/migrations';

export class Migration20260415153000_addBillingChargesAndPayments extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "billing_charges" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "target_type" text check ("target_type" in ('WORKOUT')) not null, "target_id" uuid not null, "payer_id" uuid not null, "amount_cents" int not null, "currency" varchar(255) not null default 'USD', "status" text check ("status" in ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'VOID', 'CONVERTED')) not null default 'DRAFT', "metadata" jsonb null, "expires_at" timestamptz null, constraint "billing_charges_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "billing_charges_target_type_target_id_index" on "billing_charges" ("target_type", "target_id");`);
    this.addSql(`create index "billing_charges_payer_id_index" on "billing_charges" ("payer_id");`);
    this.addSql(`create index "billing_charges_status_index" on "billing_charges" ("status");`);
    this.addSql(`create index "billing_charges_expires_at_index" on "billing_charges" ("expires_at");`);

    this.addSql(
      `create table "payments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "target_type" text check ("target_type" in ('WORKOUT')) not null, "target_id" uuid not null, "payer_id" uuid not null, "billing_charge_id" uuid null, "amount_cents" int not null, "currency" varchar(255) not null default 'USD', "status" text check ("status" in ('NONE', 'REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'REQUIRES_ACTION', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')) not null default 'REQUIRES_PAYMENT_METHOD', "provider" varchar(255) not null default 'stripe', "provider_payment_intent_id" varchar(255) not null, "metadata" jsonb null, "failure_reason" text null, "paid_at" timestamptz null, "refunded_at" timestamptz null, constraint "payments_pkey" primary key ("id"));`,
    );
    this.addSql(`alter table "payments" add constraint "payments_provider_payment_intent_id_unique" unique ("provider_payment_intent_id");`);
    this.addSql(`create index "payments_target_type_target_id_index" on "payments" ("target_type", "target_id");`);
    this.addSql(`create index "payments_payer_id_index" on "payments" ("payer_id");`);
    this.addSql(`create index "payments_billing_charge_id_index" on "payments" ("billing_charge_id");`);
    this.addSql(`create index "payments_status_index" on "payments" ("status");`);
    this.addSql(`create index "payments_provider_index" on "payments" ("provider");`);
    this.addSql(`create index "payments_paid_at_index" on "payments" ("paid_at");`);
    this.addSql(`create index "payments_refunded_at_index" on "payments" ("refunded_at");`);

    this.addSql(
      `alter table "billing_charges" add constraint "billing_charges_payer_id_foreign" foreign key ("payer_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_payer_id_foreign" foreign key ("payer_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_billing_charge_id_foreign" foreign key ("billing_charge_id") references "billing_charges" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "payments" drop constraint "payments_billing_charge_id_foreign";`);
    this.addSql(`alter table "payments" drop constraint "payments_payer_id_foreign";`);
    this.addSql(`alter table "billing_charges" drop constraint "billing_charges_payer_id_foreign";`);
    this.addSql(`drop index "payments_refunded_at_index";`);
    this.addSql(`drop index "payments_paid_at_index";`);
    this.addSql(`drop index "payments_provider_index";`);
    this.addSql(`drop index "payments_status_index";`);
    this.addSql(`drop index "payments_billing_charge_id_index";`);
    this.addSql(`drop index "payments_payer_id_index";`);
    this.addSql(`drop index "payments_target_type_target_id_index";`);
    this.addSql(`alter table "payments" drop constraint "payments_provider_payment_intent_id_unique";`);
    this.addSql(`drop table if exists "payments" cascade;`);
    this.addSql(`drop index "billing_charges_expires_at_index";`);
    this.addSql(`drop index "billing_charges_status_index";`);
    this.addSql(`drop index "billing_charges_payer_id_index";`);
    this.addSql(`drop index "billing_charges_target_type_target_id_index";`);
    this.addSql(`drop table if exists "billing_charges" cascade;`);
  }
}

