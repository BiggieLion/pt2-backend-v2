import { CURP_REGEX, PASSWORD_REGEX, RFC_REGEX } from '@shared/constants/regex';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDecimal,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateRequesterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(CURP_REGEX, {
    message: 'CURP format is invalid',
  })
  curp: string;

  @IsString()
  @IsNotEmpty()
  @Matches(RFC_REGEX, {
    message: 'RFC format is invalid',
  })
  rfc: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @Type(() => Number)
  @IsDecimal()
  @IsNotEmpty()
  monthly_income: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Matches(PASSWORD_REGEX, {
    message:
      'Password must be at least 6 characters, include an uppercase letter, a number, and a special symbol',
  })
  password: string;

  @IsString()
  @IsOptional()
  sub: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['M', 'F'], { message: 'Gender must be either M or F' })
  gender: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  count_children: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  count_adults: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  count_family_members: number;

  @IsString()
  @IsNotEmpty()
  civil_status: string;

  @IsString()
  @IsNotEmpty()
  education_level: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  occupation_type: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  days_employed: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  birthdate: Date;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsNotEmpty()
  has_own_car: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsNotEmpty()
  has_own_realty: boolean;
}
