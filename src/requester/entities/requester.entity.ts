import { AbstractEntity } from '@config/database';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';

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

  @Column({ nullable: false, type: 'numeric' })
  monthly_income: number;

  @Column({ nullable: false, type: 'varchar', unique: true })
  email: string;

  @Column({ nullable: false, type: 'varchar', select: false })
  password: string;

  @Column({ nullable: true, type: 'varchar' })
  sub: string;

  @Column({ nullable: false, type: 'varchar' })
  address: string;

  @Column({ nullable: false, type: 'char' })
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

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      const saltRounds: number = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }
}
