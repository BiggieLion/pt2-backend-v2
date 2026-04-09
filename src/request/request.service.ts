import { Injectable, Logger } from '@nestjs/common';
import { RequestRepository } from './request.repository';
import { RequesterRepository } from '@requester/requester.repository';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    private readonly requestRepo: RequestRepository,
    private readonly requesterRepo: RequesterRepository,
  ) {}
}
