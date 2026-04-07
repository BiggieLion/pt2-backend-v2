import { AbstractEntity } from '@config/database';
import { CreditType, RequestStatus } from '@request/constants';
import { Requester } from '@requester/entities/requester.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { MoneyTransformer } from '@common/transformers/money.transformer';

@Entity('request')
export class Request extends AbstractEntity<Request> {
  @Column({
    nullable: false,
    type: 'enum',
    enum: CreditType,
    enumName: 'credit_type',
  })
  credit_type: CreditType;

  @Column({
    nullable: false,
    type: 'enum',
    enum: RequestStatus,
    enumName: 'request_status',
    default: RequestStatus.CREATED,
  })
  status: RequestStatus;

  @Column({ nullable: false, type: 'timestamptz' })
  termination_date: Date;

  @Column({ nullable: false, type: 'bigint', transformer: MoneyTransformer })
  amount: number;

  @Column({ nullable: false, type: 'boolean', default: false })
  has_guarantee: boolean;

  @Column({ nullable: false, default: 0, type: 'bigint', transformer: MoneyTransformer })
  guarantee_value: number;

  @ManyToOne(() => Requester, (requester: Requester) => requester.requests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_id' })
  requester: Requester;
}
