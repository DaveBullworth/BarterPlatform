import { Test, TestingModule } from '@nestjs/testing';
import { DeactivationService } from './deactivation.service';

describe('DeactivationService', () => {
  let service: DeactivationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeactivationService],
    }).compile();

    service = module.get<DeactivationService>(DeactivationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
