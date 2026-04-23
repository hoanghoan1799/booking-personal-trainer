import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { NotificationsSwagger } from '../constants/notifications-swagger.constants';
import { NotificationType } from '../enums/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty(NotificationsSwagger.Dto.NotificationResponse.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(NotificationsSwagger.Dto.NotificationResponse.ApiProperty.Type)
  @Expose()
  type: NotificationType;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiPropertyOptional(
    NotificationsSwagger.Dto.NotificationResponse.ApiPropertyOptional.Data,
  )
  @Expose()
  data?: Record<string, unknown> | null;

  @ApiProperty()
  @Expose()
  isRead: boolean;

  @ApiPropertyOptional(
    NotificationsSwagger.Dto.NotificationResponse.ApiPropertyOptional.CreatedAt,
  )
  @Expose()
  createdAt?: Date;
}
