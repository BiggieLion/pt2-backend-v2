import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  protected readonly logger = new Logger(AuthController.name);
  constructor(private readonly authSvc: AuthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    this.logger.log('Health check');
    return 'Auth service is healthy';
  }
}
