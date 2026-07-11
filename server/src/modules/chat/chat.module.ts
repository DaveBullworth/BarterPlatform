import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatMessageEntity } from '@/database/entities/chat-message.entity';
import { ChatAttachmentEntity } from '@/database/entities/chat-attachment.entity';
import { OfferEntity } from '@/database/entities/offer.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FileScanService } from './file-scan/file-scan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatMessageEntity,
      ChatAttachmentEntity,
      OfferEntity,
      UserEntity,
    ]),
    AuthModule,
    NotificationsModule,
    RedisModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, FileScanService],
  exports: [ChatService],
})
export class ChatModule {}
