import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

import { utcNowAsDate } from '../utils/date-time/utc-date-time.helper';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property()
  createdAt?: Date = utcNowAsDate();

  @Property({ onUpdate: () => utcNowAsDate() })
  updatedAt?: Date = utcNowAsDate();
}
