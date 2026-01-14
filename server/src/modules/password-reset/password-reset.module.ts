import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetTokenEntity } from '@/database/entities/password_reset_token.entity';
import { UserEntity } from '@/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetTokenEntity, UserEntity]),
    MailModule,
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
})
export class PasswordResetModule {}
