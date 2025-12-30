import { Test, TestingModule } from '@nestjs/testing';
import { MailConfirmService } from './mail-confirm.service';

describe('MailConfirmService', () => {
  let service: MailConfirmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailConfirmService],
    }).compile();

    service = module.get<MailConfirmService>(MailConfirmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
