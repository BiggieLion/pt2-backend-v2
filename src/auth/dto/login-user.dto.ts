import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_REGEX } from '@shared/constants';
import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'P@ssw0rd!',
    required: true,
    format: PASSWORD_REGEX.source,
  })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'Invalid password format' })
  password: string;
}
