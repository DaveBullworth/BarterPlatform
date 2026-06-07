import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  NotificationEntityType,
  NotificationSubtype,
  NotificationType,
} from '@/database/entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ example: NotificationSubtype.OFFER_RECEIVED })
  subtype!: NotificationSubtype;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({ enum: NotificationEntityType, nullable: true })
  entityType!: NotificationEntityType | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiPropertyOptional({ nullable: true })
  readAt!: Date | null;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  createdAt!: Date;
}
