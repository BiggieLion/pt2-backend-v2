import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Requester } from './entities/requester.entity';
import { LoggerModule } from '@config/logger';
import { ConfigurationModule } from '@config/configuration';
import { CognitoModule } from '@config/cognito/cognito.module';
import { RequesterService } from './requester.service';
import { RequesterController } from './requester.controller';
import { RequesterRepository } from './requester.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([Requester]),
    LoggerModule,
    ConfigurationModule,
    CognitoModule,
  ],
  providers: [RequesterService, RequesterRepository],
  controllers: [RequesterController],
})
export class RequesterModule {}
