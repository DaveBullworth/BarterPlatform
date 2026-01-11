import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@/database/entities/user.entity';

export enum MediaFileType {
  AVATAR = 'avatar',
  LOT_IMAGE = 'lot_image',
  CHAT_IMAGE = 'chat_image',
  CHAT_DOCUMENT = 'chat_document',
}

export enum MediaFileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('media_files')
export class MediaFileEntity {
  @ApiProperty({
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01',
    description: 'Уникальный идентификатор файла',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: MediaFileType.AVATAR,
    description: 'Тип медиа-файла',
    enum: MediaFileType,
  })
  @Column({
    type: 'enum',
    enum: MediaFileType,
  })
  type: MediaFileType;

  @ApiProperty({
    example: MediaFileVisibility.PUBLIC,
    description: 'Видимость файла',
    enum: MediaFileVisibility,
  })
  @Column({
    type: 'enum',
    enum: MediaFileVisibility,
    default: MediaFileVisibility.PRIVATE,
  })
  visibility: MediaFileVisibility;

  @ApiProperty({
    example: 'image/webp',
    description: 'MIME-тип файла',
  })
  @Column()
  mimeType: string;

  @ApiProperty({
    example: 24567,
    description: 'Размер файла в байтах',
  })
  @Column({ type: 'int' })
  size: number;

  @ApiProperty({
    example: 'avatars/550e8400/avatar.webp',
    description: 'Относительный путь к файлу в хранилище',
  })
  @Column()
  path: string;

  @ApiProperty({
    type: () => UserEntity,
    description: 'Пользователь — владелец файла',
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: UserEntity;

  @ApiProperty({
    example: '2026-01-11T10:30:00.000Z',
    description: 'Дата загрузки файла',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'Дата последнего обновления файла',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
