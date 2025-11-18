import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomResponseDto } from '@common/dto';
import { AuthModule } from '@auth/auth.module';
import { RequesterModule } from '@requester/requester.module';
import { RequestModule } from '@request/request.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

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

  const swaggerOptions = new DocumentBuilder()
    .setTitle('PT Backend API')
    .setDescription('REST API documentation for the PT Backend')
    .setVersion('2.0.0')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('app', 'App management endpoints')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('requester', 'Requester management endpoints')
    .addTag('request', 'Credit request management endpoints')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.production.com', 'Production server')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerOptions, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
      include: [AppModule, AuthModule, RequesterModule, RequestModule],
      extraModels: [CustomResponseDto],
    });

  SwaggerModule.setup('api/docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'PT Backend API Docs',
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
