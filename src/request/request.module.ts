import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Request } from './entities/request.entity';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { RequesterRepository } from '@requester/requester.repository';
import { Requester } from '@requester/entities/requester.entity';

@Module({
  imports: [DatabaseModule.forFeature([Request, Requester])],
  controllers: [RequestController],
  providers: [RequestService, RequesterRepository],
})
export class RequestModule {}
