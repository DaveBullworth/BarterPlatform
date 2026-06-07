import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Жизненный цикл предложения обмена:
 *
 *   PENDING ──accept──▶ ACCEPTED ──both confirm──▶ COMPLETED
 *      │                   │
 *      └──────reject───────┴──────reject──────▶ REJECTED
 *
 * COMPLETED — терминальный успех (оба подтвердили факт обмена).
 * REJECTED  — терминальный отказ любой из сторон на этапе PENDING/ACCEPTED.
 */
export enum OfferStatus {
  /** Запрос отправлен, ждёт реакции получателя. */
  PENDING = 'pending',
  /** Получатель согласился — стороны совершают обмен. */
  ACCEPTED = 'accepted',
  /** Оба участника подтвердили успешный обмен. */
  COMPLETED = 'completed',
  /** Кто-то отказался на любом из этапов до завершения. */
  REJECTED = 'rejected',
}

/**
 * Центральная сущность сделки. Позже к ней крепятся чат, уведомления, жалобы.
 * Связи намеренно «слабые» (uuid-колонки без FK-relations) — в стиле остального
 * домена проекта.
 */
@Entity('offers')
@Index('IDX_offers_recipient_status', ['recipientId', 'status'])
@Index('IDX_offers_proposer_status', ['proposerId', 'status'])
@Index('IDX_offers_lot', ['lotId'])
export class OfferEntity {
  @ApiProperty({ example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Пользователь, который ПРЕДЛАГАЕТ обмен',
  })
  @Column({ type: 'uuid' })
  proposerId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Пользователь, КОМУ сделано предложение (владелец lotId)',
  })
  @Column({ type: 'uuid' })
  recipientId!: string;

  @ApiProperty({
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c99',
    description: 'Лот получателя, на который претендует предлагающий',
  })
  @Column({ type: 'uuid' })
  lotId!: string;

  @ApiProperty({
    type: [String],
    description: 'Лоты предлагающего, отдаваемые в обмен (1..5)',
  })
  @Column('uuid', { array: true, default: () => "'{}'" })
  offeredLotIds!: string[];

  @ApiProperty({ enum: OfferStatus, example: OfferStatus.PENDING })
  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.PENDING })
  status!: OfferStatus;

  @ApiProperty({
    example: false,
    description: 'Предлагающий подтвердил факт успешного обмена',
  })
  @Column({ type: 'boolean', default: false })
  proposerCompletionConfirmed!: boolean;

  @ApiProperty({
    example: false,
    description: 'Получатель подтвердил факт успешного обмена',
  })
  @Column({ type: 'boolean', default: false })
  recipientCompletionConfirmed!: boolean;

  @ApiProperty({ example: '2026-06-06T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-06T12:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;
}
