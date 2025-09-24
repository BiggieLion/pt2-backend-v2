import { PASSWORD_REGEX } from '@shared/constants';
import { IsEmail, IsString, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'Invalid format password' })
  oldPassword: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'Password is to weak' })
  newPassword: string;

  @IsEmail()
  email: string;
}
