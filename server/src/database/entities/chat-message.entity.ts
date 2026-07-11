import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Сообщение в чате между участниками предложения обмена. «Диалог» в системе —
 * это сам оффер: сообщения ключуются по `offerId`, участники берутся из
 * offers.proposerId/recipientId. Связи намеренно «слабые» (uuid-колонки без
 * FK-relations) — в стиле OfferEntity.
 *
 * `text` nullable: сообщение может состоять только из вложений. `readAt`
 * проставляется, когда сообщение прочитала ПРОТИВОПОЛОЖНАЯ сторона (для галочек
 * прочтения и счётчика непрочитанных).
 */
@Entity('chat_messages')
@Index('IDX_chat_messages_offer_created', ['offerId', 'createdAt'])
@Index('IDX_chat_messages_offer_read', ['offerId', 'senderId', 'readAt'])
export class ChatMessageEntity {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Предложение обмена, к которому привязан диалог',
  })
  @Column({ type: 'uuid' })
  offerId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Автор сообщения (один из участников оффера)',
  })
  @Column({ type: 'uuid' })
  senderId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Текст сообщения (null — сообщение только из вложений)',
  })
  @Column({ type: 'text', nullable: true })
  text!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Когда сообщение прочитала вторая сторона',
  })
  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;
}
