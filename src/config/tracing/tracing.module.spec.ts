/* eslint-disable @typescript-eslint/unbound-method -- jest mocks */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Tracer } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';
import { TracingModule } from './tracing.module';
import { OTEL_TRACER } from './tracing.constants';
import { shutdownTracing } from './tracing';

jest.mock('./tracing', () => ({
  shutdownTracing: jest.fn().mockResolvedValue(undefined),
}));

const configMap: Record<string, string> = {
  'tracing.serviceName': 'test-service',
};

describe('TracingModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => configMap[key]),
          },
        },
        {
          provide: OTEL_TRACER,
          useFactory: (configSvc: ConfigService): Tracer => {
            const serviceName = configSvc.getOrThrow<string>(
              'tracing.serviceName',
            );
            return trace.getTracer(serviceName);
          },
          inject: [ConfigService],
        },
        TracingModule,
      ],
    }).compile();
  });

  it('deberia proveer OTEL_TRACER como un Tracer usando el serviceName de config', () => {
    const tracer = moduleRef.get<Tracer>(OTEL_TRACER);
    expect(tracer).toBeDefined();
    expect(typeof tracer.startSpan).toBe('function');
  });

  it('deberia leer tracing.serviceName del ConfigService', () => {
    const configSvc = moduleRef.get(ConfigService);
    expect(configSvc.getOrThrow).toHaveBeenCalledWith('tracing.serviceName');
  });

  it('deberia llamar shutdownTracing en onApplicationShutdown', async () => {
    const tracingModule = moduleRef.get<TracingModule>(TracingModule);
    await tracingModule.onApplicationShutdown();
    expect(shutdownTracing).toHaveBeenCalled();
  });
});
