import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database/database.module';
import { ConfigurationModule } from './config/configuration/configuration.module';
import { LoggerModule } from './config/logger/logger.module';
import { RequesterModule } from './requester/requester.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guards/roles.guard';
import { RequestModule } from './request/request.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
        {
          name: 'requester-create',
          ttl: 60000,
          limit: 5,
        },
      ],
    }),
    DatabaseModule,
    ConfigurationModule,
    LoggerModule,
    RequesterModule,
    AuthModule,
    RequestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
