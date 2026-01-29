import { Test, TestingModule } from '@nestjs/testing';
import { DeactivationController } from './deactivation.controller';

describe('DeactivationController', () => {
  let controller: DeactivationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeactivationController],
    }).compile();

    controller = module.get<DeactivationController>(DeactivationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
