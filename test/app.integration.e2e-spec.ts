import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request, { Response as SupertestResponse } from 'supertest';
import { App } from 'supertest/types';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

// Mock infrastructure-heavy modules to avoid external connections in tests
jest.mock('../src/config/database/database.module', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { EntityManager } = require('typeorm');
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
  const { getRepositoryToken } = require('@nestjs/typeorm');

  class DatabaseModule {
    public static readonly mocked = true;
    static forFeature(entities: unknown[] = []): unknown {
      const providers = [
        { provide: EntityManager, useValue: {} },
        ...entities.map((e) => ({
          provide: getRepositoryToken(e),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        })),
      ];
      return {
        module: DatabaseModule,
        providers,
        exports: providers,
      } as unknown;
    }
  }
  return { DatabaseModule };
});
jest.mock('../src/config/logger/logger.module', () => ({
  LoggerModule: class LoggerModule {
    public static readonly mocked = true;
  },
}));

// Provide required environment variables for ConfigModule validation
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'user';
process.env.DB_PASSWORD = 'pass';
process.env.DB_NAME = 'db';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY = 'x';
process.env.AWS_SECRET_KEY = 'y';
process.env.COGNITO_USER_POOL_ID = 'pool';
process.env.COGNITO_CLIENT_ID = 'client-123';
process.env.COGNITO_REQUESTER_GROUP = 'requester';
process.env.COGNITO_ANALYST_GROUP = 'analyst';
process.env.COGNITO_SUPERVISOR_GROUP = 'supervisor';
process.env.COGNITO_AUTHORITY = 'https://example.com';

describe('AppModule Integration (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Import AppModule after env and mocks are set
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const { AppModule } = require('../src/app.module');
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
