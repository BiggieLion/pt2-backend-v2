import { CURP_REGEX, PASSWORD_REGEX, RFC_REGEX } from '@shared/constants/regex';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsString,
  Matches,
} from 'class-validator';

const toUpperTrim = (v: unknown): string =>
  typeof v === 'string' ? v.toUpperCase().trim() : '';
const toLowerTrim = (v: unknown): string =>
  typeof v === 'string' ? v.toLowerCase().trim() : '';
const toTrim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export class CreateRequesterDto {
  @Transform(({ value }) => toUpperTrim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(18)
  @Matches(CURP_REGEX, {
    message: 'CURP format is invalid',
  })
  curp: string;

  @Transform(({ value }) => toUpperTrim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(13)
  @Matches(RFC_REGEX, {
    message: 'RFC format is invalid',
  })
  rfc: string;

  @Transform(({ value }) => toTrim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstname: string;

  @Transform(({ value }) => toTrim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastname: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  monthly_income: number;

  @Transform(({ value }) => toLowerTrim(value))
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  @Matches(PASSWORD_REGEX, {
    message:
      'Password must be at least 8 characters and include an uppercase letter, a number, and a special symbol',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['M', 'F'], { message: 'Gender must be either M or F' })
  gender: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(30)
  @IsNotEmpty()
  count_children: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(30)
  @IsNotEmpty()
  count_adults: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(40)
  @IsNotEmpty()
  count_family_members: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  civil_status: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  education_level: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsNotEmpty()
  occupation_type: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(36500)
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
