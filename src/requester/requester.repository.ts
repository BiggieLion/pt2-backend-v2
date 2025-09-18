import { AbstractRepository } from '@config/database';
import { Injectable, Logger } from '@nestjs/common';
import { Requester } from './entities/requester.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class RequesterRepository extends AbstractRepository<Requester> {
  protected readonly logger = new Logger(RequesterRepository.name);

  constructor(
    @InjectRepository(Requester) itemsRepository: Repository<Requester>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }
}
