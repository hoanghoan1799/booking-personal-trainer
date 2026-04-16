import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { NotificationType } from '../enums/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification id' })
  @Expose()
  id: string;

  @ApiProperty({ enum: NotificationType })
  @Expose()
  type: NotificationType;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiPropertyOptional({ nullable: true, type: Object })
  @Expose()
  data?: Record<string, unknown> | null;

  @ApiProperty()
  @Expose()
  isRead: boolean;

  @ApiPropertyOptional({ type: Date })
  @Expose()
  createdAt?: Date;
}
