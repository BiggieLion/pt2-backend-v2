import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database/database.module';
import { ConfigurationModule } from './config/configuration/configuration.module';
import { LoggerModule } from './config/logger/logger.module';
import { RequesterModule } from './requester/requester.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, ConfigurationModule, LoggerModule, RequesterModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
