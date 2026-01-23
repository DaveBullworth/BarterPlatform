import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailConfirmService } from './mail-confirm.service';
import { MailConfirmController } from './mail-confirm.controller';
import { EmailConfirmationEntity } from '@/database/entities/email_confirmation.entity';
import { MailModule } from '../mail/mail.module';
import { UserEntity } from '@/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailConfirmationEntity, UserEntity]), // <--- важно
    MailModule,
  ],
  providers: [MailConfirmService],
  exports: [MailConfirmService],
  controllers: [MailConfirmController],
})
export class MailConfirmModule {}
