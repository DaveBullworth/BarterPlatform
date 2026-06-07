import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationEntity } from '@/database/entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRealtimeService } from './notifications.realtime.service';
import { SseAuthGuard } from './guards/sse-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    forwardRef(() => AuthModule),
    RedisModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRealtimeService, SseAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
