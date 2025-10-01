import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response as SupertestResponse } from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { RequesterController } from '../src/requester/requester.controller';
import { RequesterService } from '../src/requester/requester.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            { ttl: 60000, limit: 10 },
            { name: 'requester-create', ttl: 60000, limit: 5 },
          ],
        }),
      ],
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
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // NOTE: Skip ValidationPipe here to focus the test on response shaping & throttling
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

  it('/requester (POST) is rate limited by named throttler', async () => {
    const service = app.get<RequesterService>(RequesterService) as unknown as {
      create: jest.Mock;
    };
    service.create.mockResolvedValue({ id: 'x', sub: 'y', email: 'a@b.c' });

    // First 5 requests should pass with 201
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/requester')
        .send({ email: 'a@b.c', password: 'Abcdef1!' })
        .expect(201);
      expect(res.body).toEqual(
        expect.objectContaining({ success: true, statusCode: 201 }),
      );
    }

    // Sixth request should be throttled with 429
    const throttled = await request(app.getHttpServer())
      .post('/requester')
      .send({ email: 'a@b.c', password: 'Abcdef1!' })
      .expect(429);
    const throttledBody = throttled.body as {
      statusCode: number;
      message?: string;
    };
    expect(throttledBody).toEqual(expect.objectContaining({ statusCode: 429 }));
    expect(typeof throttledBody.message).toBe('string');
  });
});
