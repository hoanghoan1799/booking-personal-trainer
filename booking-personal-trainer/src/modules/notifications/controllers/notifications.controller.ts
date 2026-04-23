import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// Commons
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Serialize } from '../../../common/decorators/serialize.decorator';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// Types
import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';

// DTOs
import { GetNotificationsQueryDto } from '../dtos/get-notifications-query.dto';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

// Entities
import { Notification } from '../entities/notification.entity';

// Services
import { NotificationsService } from '../services/notifications.service';
import { NotificationsSwagger } from '../constants/notifications-swagger.constants';

@ApiTags('Notifications')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Serialize(NotificationResponseDto)
  @ApiOperation(NotificationsSwagger.Controller.ApiOperation.List)
  @ApiResponse(NotificationsSwagger.Controller.ApiResponse.ListOk)
  async list(
    @Query() query: GetNotificationsQueryDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<Notification[]>> {
    return this.notificationsService.listForUser({
      recipientUserId: currentUser.id,
      page: query.page,
      limit: query.limit,
      isRead: query.isRead,
    });
  }

  @Get('unread-count')
  @ApiOperation(NotificationsSwagger.Controller.ApiOperation.UnreadCount)
  @ApiResponse(NotificationsSwagger.Controller.ApiResponse.UnreadCountOk)
  async unreadCount(
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<{ unreadCount: number }>> {
    return this.notificationsService.getUnreadCountForUser({
      recipientUserId: currentUser.id,
    });
  }

  @Patch(':id/read')
  @ApiOperation(NotificationsSwagger.Controller.ApiOperation.MarkRead)
  @ApiResponse(NotificationsSwagger.Controller.ApiResponse.MarkReadOk)
  async markRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<{ id: string; isRead: true }>> {
    return this.notificationsService.markReadForUser({
      id,
      recipientUserId: currentUser.id,
    });
  }

  @Patch('read-all')
  @ApiOperation(NotificationsSwagger.Controller.ApiOperation.MarkAllRead)
  @ApiResponse(NotificationsSwagger.Controller.ApiResponse.MarkAllReadOk)
  async markAllRead(
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<{ updated: number }>> {
    return this.notificationsService.markAllReadForUser({
      recipientUserId: currentUser.id,
    });
  }
}
