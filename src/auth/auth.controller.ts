import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthTokens,
  ConfirmForgotPasswordDto,
  ForgotPasswordDto,
  LoginUserDto,
  RefreshTokenDto,
} from './dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  protected readonly logger = new Logger(AuthController.name);
  constructor(private readonly authSvc: AuthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    this.logger.log('Health check');
    return { data: {}, message: 'Auth service is healthy' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginUserDto) {
    const data: AuthTokens = await this.authSvc.login(dto);
    return {
      data: {
        accessToken: data.idToken ?? data.accessToken,
        expiresIn: data.expiresIn,
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
      },
      message: 'Authenticated',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authSvc.forgotPassword(dto);
    return {
      data,
      message:
        'If that email address is in our database, we will send you an email to reset your password',
    };
  }

  @Post('confirm-password')
  @HttpCode(HttpStatus.OK)
  async confirmPassword(@Body() dto: ConfirmForgotPasswordDto) {
    const data = await this.authSvc.confirmForgotPassword(dto);
    return {
      data,
      message: 'Password changed successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const data: AuthTokens = await this.authSvc.refresh(dto);
    return { message: 'Token refreshed', data };
  }
}
