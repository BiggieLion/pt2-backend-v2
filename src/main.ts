import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  // Configure CORS explicitly from configuration
  const rawOrigins = config.get<string>('cors.origins');
  const corsOrigins = rawOrigins
    ? rawOrigins
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o.length > 0)
    : ['http://localhost:3000'];
  const corsCredentials = config.get<boolean>('cors.credentials') ?? true;
  app.enableCors({ origin: corsOrigins, credentials: corsCredentials });
  // Trust proxy if running behind reverse proxy (affects secure cookies)
  const httpAdapter = app.getHttpAdapter();
  const instance = (httpAdapter.getInstance?.() ?? {}) as Partial<Express> & {
    set?: (k: string, v: unknown) => void;
  };
  if (typeof instance.set === 'function') instance.set('trust proxy', 1);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
