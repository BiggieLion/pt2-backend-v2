import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let moduleRef: TestingModule;
  let controller: AppController;
  let service: AppService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleRef.get<AppController>(AppController);
    service = moduleRef.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return the default hello message', () => {
      expect(controller.getHello()).toBe('App is healthy');
    });

    it('should delegate to AppService.getHello()', () => {
      const spy = jest
        .spyOn(service, 'getHello')
        .mockReturnValue('Hello Test!');
      const result = controller.getHello();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toBe('Hello Test!');
    });
  });

  describe('provider override', () => {
    it('should allow overriding AppService for alternate response', async () => {
      const overridden = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          {
            provide: AppService,
            useValue: {
              getHello: () => 'Hola Mundo!',
            },
          },
        ],
      }).compile();

      const overriddenController = overridden.get<AppController>(AppController);
      expect(overriddenController.getHello()).toBe('Hola Mundo!');
    });
  });
});
