import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Version,
} from '@nestjs/common';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { RequesterService } from './requester.service';

@Controller('requester')
export class RequesterController {
  constructor(private readonly requesterSvc: RequesterService) {}

  @Version('1')
  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth(): string {
    return 'Requester service is healthy';
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRequesterDto: CreateRequesterDto) {
    const data = await this.requesterSvc.create(createRequesterDto);
    return { data, message: 'Requester created successfully' };
  }
}
