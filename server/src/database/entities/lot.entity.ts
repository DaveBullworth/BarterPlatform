import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LotVisibilityStatus {
  HIDDEN = 'hidden',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('lots')
export class LotEntity {
  @ApiProperty({
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01',
    description: 'Уникальный идентификатор лота',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID пользователя — владельца лота',
  })
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ApiProperty({
    example: 1,
    description: 'ID раздела (chapter)',
  })
  @Column({ type: 'int' })
  chapterId!: number;

  @ApiProperty({
    example: 10,
    description: 'ID категории',
  })
  @Column({ type: 'int' })
  categoryId!: number;

  @ApiProperty({
    example: 101,
    description: 'ID подкатегории (может быть null)',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  subcategoryId!: number | null;

  @ApiProperty({
    example: 'Продам MacBook Pro 14"',
    description: 'Краткое общее описание лота',
  })
  @Column()
  generalDescription!: string;

  @ApiProperty({
    example: 'M1 Pro, 16GB RAM, 512GB SSD, отличное состояние',
    description: 'Подробное описание характеристик',
  })
  @Column({ type: 'text' })
  characteristicsDescription!: string;

  @ApiProperty({
    example: 1,
    description: 'Количество единиц товара',
    default: 1,
  })
  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @ApiProperty({
    enum: LotVisibilityStatus,
    example: LotVisibilityStatus.HIDDEN,
    description: 'Статус видимости лота',
  })
  @Column({
    type: 'enum',
    enum: LotVisibilityStatus,
    default: LotVisibilityStatus.HIDDEN,
  })
  visibilityStatus!: LotVisibilityStatus;

  @ApiProperty({ example: 5 })
  @Column({ type: 'int' })
  regionId!: number;

  @ApiProperty({ example: 5003 })
  @Column({ type: 'int' })
  cityId!: number;

  @ApiProperty({ example: 7002, nullable: true })
  @Column({ type: 'int', nullable: true })
  districtId!: number | null;

  @ApiProperty({
    example: '2026-01-11T10:30:00.000Z',
    description: 'Дата создания лота',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'Дата последнего обновления лота',
  })
  @UpdateDateColumn()
  updatedAt!: Date;

  // Функциональное поле, не в БД, а из redis
  @ApiPropertyOptional({
    example: '2026-02-11T12:00:00.000Z',
    nullable: true,
    description: 'Date when the lot was archived (for archived lots only).',
  })
  archivationDate?: string | null;

  @ApiProperty({
    example: [
      '/media/lots/images/8fb8f722-44b0-4f7a-beb5-4dcfcbce84d2/original',
      '/media/lots/images/2865784c-1761-4f87-b397-22e2c0ec429f/original',
    ],
    description:
      'Массив ссылок на изображения лота. Первым элементом всегда идёт главное изображение.',
    isArray: true,
  })
  @Column('text', { array: true, default: () => "'{}'" })
  imageLinks!: string[];
}
