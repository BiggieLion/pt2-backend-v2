import { PASSWORD_REGEX } from '@shared/constants/regex';
import { IsEmail, IsString, Matches } from 'class-validator';

export class ConfirmForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'Password is too weak' })
  newPassword: string;
}
