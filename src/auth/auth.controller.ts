import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthTokens } from './dto/auth-tokens.dto';
import { ForgotPasswordDto } from './dto/forgot-pasword.dto';
import { ConfirmForgotPasswordDto } from './dto/confirm-forgot-password.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  protected readonly logger = new Logger(AuthController.name);
  constructor(private readonly authSvc: AuthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    this.logger.log('Health check');
    return 'Auth service is healthy';
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginUserDto, @Res() response: Response) {
    const data: AuthTokens = await this.authSvc.login(dto);
    this.logger.log(`Setting auth cookie for user login`);
    response.setHeader(
      'set-Cookie',
      `Authorization=Bearer ${data.idToken}; HttpOnly; Path=/; Max-Age=${data.expiresIn}`,
    );
    response.status(HttpStatus.OK).json({
      data: {
        accessToken: data.idToken,
        expiresIn: data.expiresIn,
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
      },
      message: 'Authenticated',
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') dto: ForgotPasswordDto) {
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
}
