import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { User } from '../../../modules/user/entities/user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User)
  user!: User;

  @Property()
  @Unique()
  token!: string;

  @Property()
  expiresAt!: Date;

  @Property({ default: false })
  isRevoked: boolean = false;
}
