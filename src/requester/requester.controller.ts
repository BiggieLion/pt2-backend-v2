import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { RequesterService } from './requester.service';
import { CognitoAuthGuard } from 'src/auth/guard/cognito.guard';

@Controller('requester')
export class RequesterController {
  constructor(private readonly requesterSvc: RequesterService) {}

  @UseGuards(CognitoAuthGuard)
  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth(): string {
    return 'Requester service is healthy';
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRequesterDto: CreateRequesterDto) {
    const data = await this.requesterSvc.create(createRequesterDto);

    return { data, message: 'Is it necessary to verify the email' };
  }
}
