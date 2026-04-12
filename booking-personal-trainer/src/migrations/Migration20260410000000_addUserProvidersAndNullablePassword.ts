import { Migration } from '@mikro-orm/migrations';

export class Migration20260410000000_addUserProvidersAndNullablePassword extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "users" alter column "password" drop not null;`);
    this.addSql(
      `create table "user_providers" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "provider_name" varchar(255) not null, "provider_user_id" varchar(255) not null, constraint "user_providers_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "user_providers" add constraint "user_providers_provider_name_provider_user_id_unique" unique ("provider_name", "provider_user_id");`,
    );
    this.addSql(
      `create index "user_providers_user_id_index" on "user_providers" ("user_id");`,
    );
    this.addSql(
      `alter table "user_providers" add constraint "user_providers_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "user_providers" drop constraint "user_providers_user_id_foreign";`,
    );
    this.addSql(`drop table if exists "user_providers" cascade;`);
    this.addSql(`alter table "users" alter column "password" set not null;`);
  }
}

