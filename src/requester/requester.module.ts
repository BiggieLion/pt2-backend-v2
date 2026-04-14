import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Requester } from './entities/requester.entity';
import { ConfigurationModule } from '@config/configuration';
import { CognitoModule } from '@config/cognito/cognito.module';
import { RequesterService } from './requester.service';
import { RequesterController } from './requester.controller';
import { RequesterRepository } from './requester.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([Requester]),
    ConfigurationModule,
    CognitoModule,
  ],
  providers: [RequesterService, RequesterRepository],
  controllers: [RequesterController],
  exports: [RequesterRepository],
})
export class RequesterModule {}
