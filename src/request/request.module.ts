import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Request } from './entities/request.entity';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { RequesterModule } from '@requester/requester.module';

@Module({
  imports: [DatabaseModule.forFeature([Request]), RequesterModule],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
