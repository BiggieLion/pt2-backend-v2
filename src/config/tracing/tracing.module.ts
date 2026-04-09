import { Global, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, Tracer } from '@opentelemetry/api';
import { OTEL_TRACER } from './tracing.constants';
import { shutdownTracing } from './tracing';

@Global()
@Module({
  providers: [
    {
      provide: OTEL_TRACER,
      useFactory: (configSvc: ConfigService): Tracer => {
        const serviceName = configSvc.getOrThrow<string>('tracing.serviceName');
        return trace.getTracer(serviceName);
      },
      inject: [ConfigService],
    },
  ],
  exports: [OTEL_TRACER],
})
export class TracingModule implements OnApplicationShutdown {
  private readonly logger = new Logger(TracingModule.name);

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down OpenTelemetry SDK');
    await shutdownTracing();
  }
}
