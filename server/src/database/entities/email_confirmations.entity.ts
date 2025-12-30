import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('email_confirmations')
export class EmailConfirmationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Случайный токен, который попадёт в ссылку
  @Column({ unique: true })
  token: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
