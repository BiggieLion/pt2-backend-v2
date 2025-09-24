import { PASSWORD_REGEX } from '@shared/constants';
import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'Invalid password format' })
  password: string;
}
