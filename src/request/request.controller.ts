import { Controller } from '@nestjs/common';
import { RequestService } from './request.service';

@Controller({ path: 'request', version: '1' })
export class RequestController {
  constructor(private readonly requestSvc: RequestService) {}
}
