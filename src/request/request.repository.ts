import { AbstractRepository } from '@config/database';
import { Injectable, Logger } from '@nestjs/common';
import { Request } from './entities/request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class RequestRepository extends AbstractRepository<Request> {
  protected readonly logger = new Logger(RequestRepository.name);

  constructor(
    @InjectRepository(Request)
    itemsRepository: Repository<Request>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }
}
