import {
  Collection,
  Entity,
  Enum,
  Index,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { Expose } from 'class-transformer';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { User } from '../../user/entities/user.entity';
import { ExerciseTemplateItem } from './exercise-template-item.entity';

// Enums
import { TemplateType } from '../enums/template-type.enum';

@Index({ properties: ['createdBy', 'templateType', 'isDeleted'] })
@Index({ properties: ['name', 'isDeleted'] })
@Entity({ tableName: 'exercise_templates' })
export class ExerciseTemplate extends BaseEntity {
  @Expose()
  @Property({ length: 255 })
  name!: string;

  @Expose()
  @Property({ type: 'text', default: '' })
  description: string = '';

  @Expose()
  @ManyToOne(() => User)
  createdBy!: User;

  @Expose()
  @Enum(() => TemplateType)
  templateType: TemplateType = TemplateType.TRAINER;

  @Expose()
  @ManyToOne(() => ExerciseTemplate, { nullable: true })
  parentTemplate?: ExerciseTemplate | null;

  @Expose()
  @OneToMany(() => ExerciseTemplateItem, (item) => item.template, {
    orphanRemoval: true,
  })
  items = new Collection<ExerciseTemplateItem>(this);

  @Expose()
  @Property({ default: false })
  isDeleted?: boolean;

  @Expose()
  @Property({ nullable: true })
  deletedAt?: string | null;
}
