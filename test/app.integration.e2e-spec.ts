import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request, { Response as SupertestResponse } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

// Mock infrastructure-heavy modules to avoid external connections in tests
jest.mock('../src/config/database/database.module', () => ({
  DatabaseModule: class DatabaseModule {
    public static readonly mocked = true;
  },
}));
jest.mock('../src/config/logger/logger.module', () => ({
  LoggerModule: class LoggerModule {
    public static readonly mocked = true;
  },
}));

describe('AppModule Integration (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mirror main.ts global setup
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health should use global response shape', async () => {
    const response: SupertestResponse = await request(app.getHttpServer())
      .get('/api/health')
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
        path: '/api/health',
        action: 'CONTINUE',
        message: 'Request completed',
      }),
    );
    expect(body.data).toBe('App is healthy');
  });

  it('GET /api/v1/requester/health should respect URI versioning', async () => {
    const response: SupertestResponse = await request(app.getHttpServer())
      .get('/api/v1/requester/health')
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
        path: '/api/v1/requester/health',
        action: 'CONTINUE',
        message: 'Request completed',
      }),
    );
    expect(body.data).toBe('Requester service is healthy');
  });
});
