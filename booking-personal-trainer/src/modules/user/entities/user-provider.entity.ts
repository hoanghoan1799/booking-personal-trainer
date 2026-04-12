import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { User } from './user.entity';

@Entity({ tableName: 'user_providers' })
@Unique({ properties: ['providerName', 'providerUserId'] })
export class UserProvider extends BaseEntity {
  @ManyToOne(() => User, { fieldName: 'user_id', nullable: true })
  user!: User;

  @Property()
  providerName!: string;

  @Property()
  providerUserId!: string;
}
