import { Entity, Enum, Property } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

@Entity()
export class Exercise extends BaseEntity {
  @Property({ length: 255 })
  name!: string;

  @Property({ type: 'text' })
  description: string;

  @Enum(() => MuscleGroup)
  muscleGroup: MuscleGroup;

  @Enum(() => Equipment)
  equipment: Equipment;

  @Property({ nullable: true })
  videoUrl?: string;

  @Property({ nullable: true })
  thumbnailUrl?: string;
}
