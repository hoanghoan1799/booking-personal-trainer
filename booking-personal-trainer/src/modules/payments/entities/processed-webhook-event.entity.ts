import { Entity, Index, Property, Unique } from '@mikro-orm/core';

import { BaseEntity } from '../../../common/entities/base.entity';

@Index({ properties: ['provider'] })
@Index({ properties: ['receivedAt'] })
@Unique({ properties: ['provider', 'eventId'] })
@Entity({ tableName: 'processed_webhook_events' })
export class ProcessedWebhookEvent extends BaseEntity {
  @Property()
  provider!: string;

  @Property({ fieldName: 'event_id' })
  eventId!: string;

  @Property({ fieldName: 'received_at' })
  receivedAt: Date = new Date();
}
