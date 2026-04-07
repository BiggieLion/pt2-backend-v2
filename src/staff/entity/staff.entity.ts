import { AbstractEntity } from '@config/database';
import { Column, Entity } from 'typeorm';

@Entity('staff')
export class Staff extends AbstractEntity<Staff> {
  @Column({ nullable: false, type: 'varchar', unique: true })
  curp: string;

  @Column({ nullable: false, type: 'varchar', unique: true })
  rfc: string;

  @Column({ nullable: false, type: 'varchar' })
  firstname: string;

  @Column({ nullable: false, type: 'varchar' })
  lastname: string;

  @Column({ nullable: false, type: 'varchar', unique: true })
  email: string;

  @Column({ nullable: false, type: 'varchar' })
  sub: string;

  @Column({ nullable: false, type: 'char' })
  gender: string;

  @Column({ nullable: false, type: 'date' })
  birthdate: Date;

  @Column({ nullable: false, type: 'varchar' })
  address: string;

  @Column({ nullable: false, type: 'varchar' })
  role: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  is_eval_credit: boolean;
}
