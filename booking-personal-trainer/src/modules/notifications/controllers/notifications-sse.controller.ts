import {
  Controller,
  MessageEvent,
  Sse,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import type { RedisClientType } from 'redis';

// Commons
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { REDIS_SUBSCRIBER_TOKEN } from '../../../common/constants/cache.constant';

// Services
import { NotificationsService } from '../services/notifications.service';

// Types
import type { CurrentRequestUser } from '../../../common/interfaces/request.interface';

@ApiTags('Notifications')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsSseController {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(REDIS_SUBSCRIBER_TOKEN)
    private readonly subscriberClient: RedisClientType,
  ) {}

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream for notifications' })
  @ApiResponse({ status: 200, description: 'SSE stream started' })
  stream(@Req() req: CurrentRequestUser): Observable<MessageEvent> {
    const userId: string = req.user.id;
    const channel: string = this.notificationsService.buildUserChannel(userId);
    return new Observable<MessageEvent>((observer) => {
      let isClosed = false;
      const handleMessage = (message: string) => {
        observer.next({
          type: 'notification',
          data: message,
        });
      };
      void this.subscriberClient.subscribe(channel, handleMessage);
      const heartbeatId = setInterval(() => {
        observer.next({ type: 'heartbeat', data: 'ping' });
      }, 25_000);
      const cleanup = async (): Promise<void> => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(heartbeatId);
        try {
          await this.subscriberClient.unsubscribe(channel, handleMessage);
        } catch {
          // Ignore unsubscribe errors during disconnect.
        }
        observer.complete();
      };
      const requestWithCloseEvent: {
        readonly on: (event: 'close', listener: () => void) => unknown;
      } = req as unknown as {
        readonly on: (event: 'close', listener: () => void) => unknown;
      };
      requestWithCloseEvent.on('close', () => {
        void cleanup();
      });
      return () => {
        void cleanup();
      };
    });
  }
}
