import { Test, TestingModule } from '@nestjs/testing';
import { MailConfirmController } from './mail-confirm.controller';

describe('MailConfirmController', () => {
  let controller: MailConfirmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailConfirmController],
    }).compile();

    controller = module.get<MailConfirmController>(MailConfirmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
