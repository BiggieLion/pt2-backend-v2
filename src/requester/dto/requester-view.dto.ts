import { Expose } from 'class-transformer';

export class RequesterViewDto {
  @Expose() id: string;
  @Expose() curp: string;
  @Expose() rfc: string;
  @Expose() firstname: string;
  @Expose() lastname: string;
  @Expose() monthly_income: number;
  @Expose() email: string;
  @Expose() address: string;
  @Expose() gender: string;
  @Expose() has_ine: boolean;
  @Expose() has_birth: boolean;
  @Expose() has_domicile: boolean;
  @Expose() has_guarantee: boolean;
  @Expose() count_children: number;
  @Expose() count_adults: number;
  @Expose() count_family_members: number;
  @Expose() civil_status: string;
  @Expose() education_level: string;
  @Expose() occupation_type: number;
  @Expose() days_employed: number;
  @Expose() birthdate: Date;
  @Expose() has_own_car: boolean;
  @Expose() has_own_realty: boolean;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
