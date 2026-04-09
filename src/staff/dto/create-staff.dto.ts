import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { PASSWORD_REGEX } from '@shared/constants/regex';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @Length(18, 18, { message: 'CURP must be 18 characters length' })
  curp: string;

  @IsString()
  @IsNotEmpty()
  @Length(13, 13, { message: 'RFC must be 13 characters length' })
  rfc: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['M', 'F'], {
    message: 'Gender must be either M for Masculino or F for Femeninto',
  })
  gender: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must be at least 8 characters and include an uppercase letter, a number, and a special symbol',
  })
  password: string;

  @IsString()
  @IsOptional()
  sub: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  birthdate: Date;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}
