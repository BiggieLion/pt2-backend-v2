import { Test, TestingModule } from '@nestjs/testing';
import { RequesterService } from './requester.service';

describe('RequesterService', () => {
  let service: RequesterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequesterService],
    }).compile();

    service = module.get<RequesterService>(RequesterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
