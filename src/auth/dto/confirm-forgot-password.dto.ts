import { PASSWORD_REGEX } from '@shared/constants/regex';
import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Verification code received via email',
    example: '123456',
    type: String,
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'New password for the user account',
    example: 'NewSecureP@ssw0rd',
    type: String,
  })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'Password is too weak' })
  newPassword: string;
}
