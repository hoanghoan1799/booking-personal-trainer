import { Migration } from '@mikro-orm/migrations';

export class Migration20260206052116_updateIsDeleteFieldForExercisesTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "exercise" add column "is_deleted" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "exercise" drop column "is_deleted";`);
  }

}
