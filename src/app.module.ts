import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database/database.module';
import { ConfigurationModule } from './config/configuration/configuration.module';
import { LoggerModule } from './config/logger/logger.module';

@Module({
  imports: [DatabaseModule, ConfigurationModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
