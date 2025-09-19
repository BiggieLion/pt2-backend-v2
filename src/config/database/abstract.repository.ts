import { Logger, NotFoundException } from '@nestjs/common';
import { AbstractEntity } from './abstract.entity';
import {
  DeleteResult,
  EntityManager,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
  UpdateResult,
} from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class AbstractRepository<T extends AbstractEntity<T>> {
  protected abstract readonly logger: Logger;

  constructor(
    private readonly itemsRepository: Repository<T>,
    protected readonly entityManager: EntityManager,
  ) {}

  async create(entity: T): Promise<T> {
    return this.entityManager.save(entity);
  }

  async find(
    where?: FindOptionsWhere<T>,
    select?: FindOptionsSelect<T>,
  ): Promise<T[]> {
    return this.itemsRepository.find({ where, select });
  }

  async findOne(
    where: FindOptionsWhere<T>,
    relations?: FindOptionsRelations<T>,
    select?: FindOptionsSelect<T>,
    order?: FindOptionsOrder<T>,
  ): Promise<T> {
    const entity: T | null = await this.itemsRepository.findOne({
      where,
      select,
      relations,
      order,
    });

    if (!entity) {
      this.logger.warn(
        `Entity not found with the next conditions: ${JSON.stringify(where)} \n ${JSON.stringify(select)} \n ${JSON.stringify(relations)} `,
      );

      throw new NotFoundException('Entity not found');
    }

    return entity;
  }

  async findOneAndUpdate(
    where: FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<T> {
    const updateResult: UpdateResult = await this.itemsRepository.update(
      where,
      partialEntity,
    );

    if (!updateResult.affected) {
      this.logger.warn(
        `Entity not found with the next where conditions: `,
        where,
      );

      throw new NotFoundException('Entity not found');
    }

    return this.findOne(where);
  }

  async findOneAndDelete(where: FindOptionsWhere<T>): Promise<DeleteResult> {
    return this.itemsRepository.delete(where);
  }
}
