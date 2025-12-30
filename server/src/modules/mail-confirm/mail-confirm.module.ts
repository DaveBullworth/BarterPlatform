import { Module } from '@nestjs/common';
import { MailConfirmService } from './mail-confirm.service';
import { MailConfirmController } from './mail-confirm.controller';

@Module({
  providers: [MailConfirmService],
  exports: [MailConfirmService],
  controllers: [MailConfirmController],
})
export class MailConfirmModule {}
