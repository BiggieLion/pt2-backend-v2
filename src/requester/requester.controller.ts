import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { RequesterService } from './requester.service';

@Controller({ path: 'requester', version: '1' })
export class RequesterController {
  constructor(private readonly requesterSvc: RequesterService) {}
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
