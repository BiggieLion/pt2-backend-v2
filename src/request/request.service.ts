import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Requester } from '@requester/entities/requester.entity';
import { RequesterRepository } from '@requester/requester.repository';
import { Repository } from 'typeorm';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Requester)
    private readonly requesterRepo: Repository<Requester>,
    private readonly requestRepo: RequesterRepository,
    private readonly configSvc: ConfigService,
  ) {}
}
