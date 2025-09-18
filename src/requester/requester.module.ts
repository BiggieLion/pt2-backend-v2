import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Requester } from './entities/requester.entity';
import { LoggerModule } from '@config/logger';
import { ConfigurationModule } from '@config/configuration';
import { RequesterService } from './requester.service';
import { RequesterController } from './requester.controller';

@Module({
  imports: [
    DatabaseModule.forFeature([Requester]),
    LoggerModule,
    ConfigurationModule,
  ],
  providers: [RequesterService],
  controllers: [RequesterController],
})
export class RequesterModule {}
