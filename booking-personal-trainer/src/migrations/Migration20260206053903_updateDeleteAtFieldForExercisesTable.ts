import { Migration } from '@mikro-orm/migrations';

export class Migration20260206053903_updateDeleteAtFieldForExercisesTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "exercise" add column "deleted_at" varchar(255) null;`);
    this.addSql(`create index "exercise_is_deleted_index" on "exercise" ("is_deleted");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "exercise_is_deleted_index";`);
    this.addSql(`alter table "exercise" drop column "deleted_at";`);
  }

}
