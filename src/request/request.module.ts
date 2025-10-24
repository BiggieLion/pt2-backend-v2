import { DatabaseModule } from '@config/database';
import { Module } from '@nestjs/common';
import { Request } from './entities/request.entity';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [DatabaseModule.forFeature([Request])],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
