import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return the health message and log', () => {
      const logSpy = jest.spyOn(
        (controller as unknown as { logger: { log: (msg: string) => void } })
          .logger,
        'log',
      );
      const result = controller.healthCheck();
      expect(result).toEqual({ data: {}, message: 'Auth service is healthy' });
      expect(logSpy).toHaveBeenCalledWith('Health check');
    });
  });
});
