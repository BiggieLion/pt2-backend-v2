import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Requester } from './entities/requester.entity';
import { LoggerModule } from '@config/logger';
import { ConfigurationModule } from '@config/configuration';

@Module({
  imports: [
    DatabaseModule.forFeature([Requester]),
    LoggerModule,
    ConfigurationModule,
  ],
})
export class RequesterModule {}
