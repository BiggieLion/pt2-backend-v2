import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDataDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string | undefined;

  @ApiProperty({ example: 3600 })
  expiresIn: number | undefined;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string | undefined;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;
}

export class ForgotPasswordResponseDataDto {
  @ApiProperty({
    description: 'Code delivery details',
    required: false,
    example: { DeliveryMedium: 'EMAIL', Destination: 'u***@example.com' },
  })
  delivery?: any;
}

export class ConfirmPasswordResponseDataDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class RefreshTokenResponseDataDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken?: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  idToken?: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken?: string;

  @ApiProperty({ example: 3600 })
  expiresIn?: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType?: string;
}
