import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ChatAttachmentKind,
  ChatAttachmentScanStatus,
} from '@/database/entities/chat-attachment.entity';

export class ChatAttachmentResponseDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  id!: string;

  @ApiProperty({ enum: ChatAttachmentKind, example: ChatAttachmentKind.IMAGE })
  kind!: ChatAttachmentKind;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;

  @ApiProperty({ example: 245678 })
  size!: number;

  @ApiProperty({ example: 'receipt.pdf' })
  originalName!: string;

  @ApiProperty({
    enum: ChatAttachmentScanStatus,
    example: ChatAttachmentScanStatus.SKIPPED,
  })
  scanStatus!: ChatAttachmentScanStatus;
}

export class ChatMessageResponseDto {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  offerId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  senderId!: string;

  @ApiProperty({ description: 'Отправлено текущим пользователем' })
  isMine!: boolean;

  @ApiPropertyOptional({ nullable: true })
  text!: string | null;

  @ApiProperty({ type: [ChatAttachmentResponseDto] })
  attachments!: ChatAttachmentResponseDto[];

  @ApiPropertyOptional({ nullable: true, description: 'Когда прочитано второй стороной' })
  readAt!: Date | null;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  createdAt!: Date;
}

export class ChatMessagesPageDto {
  @ApiProperty({
    type: [ChatMessageResponseDto],
    description: 'Сообщения в хронологическом порядке (старые → новые)',
  })
  data!: ChatMessageResponseDto[];

  @ApiProperty({ description: 'Есть ли ещё более старые сообщения' })
  hasMore!: boolean;
}

export class ChatUnreadByOfferItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  offerId!: string;

  @ApiProperty({ example: 3 })
  unread!: number;
}
