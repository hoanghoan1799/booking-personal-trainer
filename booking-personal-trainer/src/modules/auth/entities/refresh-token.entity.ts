import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';

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
