import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Вид вложения — определяет, как клиент его рендерит. */
export enum ChatAttachmentKind {
  IMAGE = 'image',
  DOCUMENT = 'document',
}

/**
 * Результат антивирусной проверки. `skipped` — сканер отключён (no-op в dev/
 * offline). `infected` файлы не доходят до хранилища (отклоняются при загрузке),
 * статус оставлен в наборе на случай асинхронного сканирования в будущем.
 */
export enum ChatAttachmentScanStatus {
  PENDING = 'pending',
  CLEAN = 'clean',
  INFECTED = 'infected',
  SKIPPED = 'skipped',
  ERROR = 'error',
}

/**
 * Вложение чата (PNG/JPG/PDF). Приватный файл — отдаётся только участникам оффера
 * через авторизованный эндпоинт. До отправки сообщения вложение «осиротевшее»
 * (messageId = null): пользователь прикрепил файл, но ещё не нажал «Отправить».
 */
@Entity('chat_attachments')
@Index('IDX_chat_attachments_offer', ['offerId'])
@Index('IDX_chat_attachments_message', ['messageId'])
export class ChatAttachmentEntity {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Предложение обмена (диалог), к которому относится вложение',
  })
  @Column({ type: 'uuid' })
  offerId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Сообщение-владелец; null пока вложение не отправлено',
  })
  @Column({ type: 'uuid', nullable: true })
  messageId!: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Кто загрузил вложение',
  })
  @Column({ type: 'uuid' })
  uploaderId!: string;

  @ApiProperty({ enum: ChatAttachmentKind, example: ChatAttachmentKind.IMAGE })
  @Column({ type: 'enum', enum: ChatAttachmentKind })
  kind!: ChatAttachmentKind;

  @ApiProperty({ example: 'image/png' })
  @Column()
  mimeType!: string;

  @ApiProperty({ example: 245678, description: 'Размер файла в байтах' })
  @Column({ type: 'int' })
  size!: number;

  @ApiProperty({ example: 'receipt.pdf', description: 'Исходное имя файла' })
  @Column()
  originalName!: string;

  @ApiProperty({
    example: 'chat/550e8400/c2a1e2a5.png',
    description: 'Относительный путь к файлу в хранилище',
  })
  @Column()
  path!: string;

  @ApiProperty({
    enum: ChatAttachmentScanStatus,
    example: ChatAttachmentScanStatus.SKIPPED,
  })
  @Column({
    type: 'enum',
    enum: ChatAttachmentScanStatus,
    default: ChatAttachmentScanStatus.PENDING,
  })
  scanStatus!: ChatAttachmentScanStatus;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;
}
