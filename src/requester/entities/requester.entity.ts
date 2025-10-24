import { AbstractEntity } from '@config/database';
import { Request } from '@request/entities/request.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('requester')
export class Requester extends AbstractEntity<Requester> {
  @Column({ nullable: false, type: 'varchar', unique: true })
  curp: string;

  @Column({ nullable: false, type: 'varchar' })
  firstname: string;

  @Column({ nullable: false, type: 'varchar' })
  lastname: string;

  @Column({ nullable: false, type: 'varchar', unique: true })
  rfc: string;

  @Column({
    nullable: false,
    type: 'bigint',
    transformer: {
      // Backend sends 123.45 -> database stores as 12345 cents
      to: (value: number): string => {
        if (typeof value !== 'number' || Number.isNaN(value)) return '0';
        return Math.round(value * 100).toString();
      },
      // Database return '12345' cents -> backend gets 123.45
      from: (value: string): number => {
        const cents: number = parseInt(value, 10);
        return cents / 100;
      },
    },
  })
  monthly_income: number;

  @Column({ nullable: false, type: 'varchar', unique: true })
  email: string;

  @Column({ nullable: true, type: 'varchar' })
  sub: string;

  @Column({ nullable: false, type: 'varchar' })
  address: string;

  @Column({ nullable: false, type: 'char', length: 1 })
  gender: string;

  @Column({ nullable: true, type: 'boolean', default: false })
  has_ine: boolean;

  @Column({ nullable: true, type: 'boolean', default: false })
  has_birth: boolean;

  @Column({ nullable: true, type: 'boolean', default: false })
  has_domicile: boolean;

  @Column({ nullable: true, type: 'boolean', default: false })
  has_guarantee: boolean;

  @Column({ nullable: false, type: 'smallint' })
  count_children: number;

  @Column({ nullable: false, type: 'smallint' })
  count_adults: number;

  @Column({ nullable: false, type: 'smallint' })
  count_family_members: number;

  @Column({ nullable: false, type: 'varchar' })
  civil_status: string;

  @Column({ nullable: false, type: 'varchar' })
  education_level: string;

  @Column({ nullable: false, type: 'smallint' })
  occupation_type: number;

  @Column({ nullable: false, type: 'integer' })
  days_employed: number;

  @Column({ nullable: false, type: 'date' })
  birthdate: Date;

  @Column({ nullable: false, type: 'boolean' })
  has_own_car: boolean;

  @Column({ nullable: false, type: 'boolean' })
  has_own_realty: boolean;

  @Column({ nullable: false, type: 'boolean', default: false })
  has_active_request: boolean;

  @OneToMany(() => Request, (request: Request) => request.requester)
  requests: Request[];
}
