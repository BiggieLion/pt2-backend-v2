import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { Response as SupertestResponse } from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { RequesterController } from '../src/requester/requester.controller';
import { RequesterService } from '../src/requester/requester.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, RequesterController],
      providers: [
        AppService,
        {
          provide: RequesterService,
          useValue: {
            getHealth: () => 'Requester service is healthy',
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  it('/health (GET) returns standardized response', async () => {
    const response: SupertestResponse = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    type StandardResponse = {
      statusCode: number;
      success: boolean;
      timestamp: number;
      path: string;
      action: 'CONTINUE' | 'CANCEL';
      message: string;
      data: unknown;
    };
    const body = response.body as StandardResponse;
    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 200,
        success: true,
        path: '/health',
        action: 'CONTINUE',
        message: 'Request completed',
      }),
    );

    // Data should contain the raw controller payload (string)
    expect(body.data).toBe('App is healthy');
    expect(typeof body.timestamp).toBe('number');
  });

  it('/requester/health (GET) returns standardized health response', async () => {
    const response: SupertestResponse = await request(app.getHttpServer())
      .get('/requester/health')
      .expect(200);

    type StandardResponse = {
      statusCode: number;
      success: boolean;
      timestamp: number;
      path: string;
      action: 'CONTINUE' | 'CANCEL';
      message: string;
      data: unknown;
    };
    const body = response.body as StandardResponse;
    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 200,
        success: true,
        path: '/requester/health',
        action: 'CONTINUE',
        message: 'Request completed',
      }),
    );
    expect(body.data).toBe('Requester service is healthy');
    expect(typeof body.timestamp).toBe('number');
  });
});
