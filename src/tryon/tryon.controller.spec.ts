import { Test, TestingModule } from '@nestjs/testing';
import { TryonController } from './tryon.controller';

describe('TryonController', () => {
  let controller: TryonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TryonController],
    }).compile();

    controller = module.get<TryonController>(TryonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
