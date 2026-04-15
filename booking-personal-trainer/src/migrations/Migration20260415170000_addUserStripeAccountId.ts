import { Migration } from '@mikro-orm/migrations';

export class Migration20260415170000_addUserStripeAccountId extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "stripe_account_id" varchar(255) null;`);
    this.addSql(`create index "users_stripe_account_id_index" on "users" ("stripe_account_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "users_stripe_account_id_index";`);
    this.addSql(`alter table "users" drop column "stripe_account_id";`);
  }
}

