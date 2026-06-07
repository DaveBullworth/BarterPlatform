import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Sse,
  type MessageEvent,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, concat, defer, from, interval, map, merge } from 'rxjs';

import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
import { NotificationsRealtimeService } from './notifications.realtime.service';
import { SseAuthGuard } from './guards/sse-auth.guard';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationListResponseDto } from './dto/notification-list-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

const HEARTBEAT_MS = 25_000;

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly realtime: NotificationsRealtimeService,
  ) {}

  @ApiBearerAuth()
  @Authenticated()
  @Get()
  @ApiOperation({
    summary: 'Список уведомлений (пагинация, фильтр непрочитанных)',
  })
  @ApiOkResponse({ type: NotificationListResponseDto })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    return this.notificationsService.findForUser(user.sub, query);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Get('unread-count')
  @ApiOperation({ summary: 'Счётчик непрочитанных' })
  async unreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ count: number }> {
    return { count: await this.notificationsService.getUnreadCount(user.sub) };
  }

  @ApiBearerAuth()
  @Authenticated()
  @Patch('read-all')
  @ApiOperation({ summary: 'Отметить все уведомления прочитанными' })
  markAllRead(@CurrentUser() user: JwtPayload): Promise<{ success: true }> {
    return this.notificationsService.markAllRead(user.sub);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить уведомление прочитанным' })
  @ApiOkResponse({ type: NotificationResponseDto })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markRead(id, user.sub);
  }

  /**
   * Real-time SSE-поток. EventSource не умеет слать заголовки, поэтому токен
   * принимается через ?token= (или Authorization — для fetch-based клиентов),
   * см. SseAuthGuard.
   */
  @ApiOperation({ summary: 'SSE-поток уведомлений (real-time)' })
  @UseGuards(SseAuthGuard)
  @Sse('stream')
  stream(@CurrentUser() user: JwtPayload): Observable<MessageEvent> {
    const initial$ = defer(() =>
      from(this.notificationsService.getUnreadCount(user.sub)),
    ).pipe(
      map(
        (unreadCount) =>
          ({
            data: { kind: 'notification:unread', unreadCount },
          }) as MessageEvent,
      ),
    );

    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      map(() => ({ data: { kind: 'ping' } }) as MessageEvent),
    );

    return merge(
      concat(initial$, this.realtime.streamForUser(user.sub)),
      heartbeat$,
    );
  }
}
