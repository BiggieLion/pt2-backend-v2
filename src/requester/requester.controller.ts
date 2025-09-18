import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'requester', version: '1' })
export class RequesterController {
  @Get('health')
  getHealth(): string {
    return 'Requester service is healthy';
  }
}
