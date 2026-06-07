import { ApiProperty } from '@nestjs/swagger';

import { NotificationResponseDto } from './notification-response.dto';

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data!: NotificationResponseDto[];

  @ApiProperty({ example: 42, description: 'Всего уведомлений (под фильтр)' })
  total!: number;

  @ApiProperty({ example: 5, description: 'Непрочитанных всего' })
  unreadCount!: number;
}
