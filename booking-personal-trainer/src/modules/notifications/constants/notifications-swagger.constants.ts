import { HttpStatus } from '@nestjs/common';
import type { ApiPropertyOptions, ApiResponseOptions } from '@nestjs/swagger';

import { NotificationType } from '../enums/notification-type.enum';

export const NotificationsSwagger = {
  Controller: {
    ApiOperation: {
      List: { summary: 'List notifications for current user' },
      UnreadCount: { summary: 'Get unread notification count' },
      MarkRead: { summary: 'Mark a notification as read' },
      MarkAllRead: { summary: 'Mark all notifications as read' },
      Stream: { summary: 'SSE stream for notifications' },
    },
    ApiResponse: {
      ListOk: {
        status: HttpStatus.OK,
        description: 'Notifications list',
      },
      UnreadCountOk: {
        status: HttpStatus.OK,
        description: 'Unread count',
      },
      MarkReadOk: {
        status: HttpStatus.OK,
        description: 'Marked as read',
      },
      MarkAllReadOk: {
        status: HttpStatus.OK,
        description: 'Marked all as read',
      },
      StreamOk: {
        status: HttpStatus.OK,
        description: 'SSE stream started',
      },
    } satisfies Record<string, ApiResponseOptions>,
  },
  Dto: {
    NotificationResponse: {
      ApiProperty: {
        Id: { description: 'Notification id' },
        Type: { enum: NotificationType },
      } satisfies Record<string, ApiPropertyOptions>,
      ApiPropertyOptional: {
        Data: { nullable: true, type: Object },
        CreatedAt: { type: Date },
      } satisfies Record<string, ApiPropertyOptions>,
    },
    GetNotificationsQuery: {
      ApiPropertyOptional: {
        Page: { default: 1, minimum: 1 },
        Limit: { default: 20, minimum: 1, maximum: 100 },
        IsRead: {
          description: 'Filter by read state',
          type: Boolean,
          nullable: true,
        },
      } satisfies Record<string, ApiPropertyOptions>,
    },
  },
} as const;
