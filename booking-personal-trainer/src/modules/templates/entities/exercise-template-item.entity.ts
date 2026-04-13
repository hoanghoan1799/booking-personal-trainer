import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { Expose } from 'class-transformer';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { Exercise } from '../../exercise/entities/exercise.entity';
import { ExerciseTemplate } from './exercise-template.entity';

@Index({ properties: ['template', 'order'] })
@Entity({ tableName: 'exercise_template_items' })
export class ExerciseTemplateItem extends BaseEntity {
  @Expose()
  @ManyToOne(() => ExerciseTemplate)
  template!: ExerciseTemplate;

  @Expose()
  @ManyToOne(() => Exercise)
  exercise!: Exercise;

  @Expose()
  @Property()
  order!: number;

  @Expose()
  @Property({ type: 'int', nullable: true })
  sets: number | null = null;

  @Expose()
  @Property({ type: 'int', nullable: true })
  reps: number | null = null;

  @Expose()
  @Property({ type: 'int', nullable: true })
  restSeconds: number | null = null;

  @Expose()
  @Property({ type: 'text', default: '' })
  notes: string = '';
}
