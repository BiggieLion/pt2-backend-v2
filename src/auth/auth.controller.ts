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
  LoginResponseDataDto,
  ForgotPasswordResponseDataDto,
  ConfirmPasswordResponseDataDto,
  RefreshTokenResponseDataDto,
} from './dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CustomResponseDto } from '@common/dto/custom-response.dto';

@ApiTags('auth')
@ApiExtraModels(
  CustomResponseDto,
  LoginResponseDataDto,
  ForgotPasswordResponseDataDto,
  ConfirmPasswordResponseDataDto,
  RefreshTokenResponseDataDto,
)
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  protected readonly logger = new Logger(AuthController.name);
  constructor(private readonly authSvc: AuthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Checks if the auth service is running',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auth service is healthy',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'Auth service is healthy' },
            data: {
              type: 'object',
              example: {},
            },
          },
        },
      ],
    },
  })
  healthCheck() {
    this.logger.log('Health check');
    return { data: {}, message: 'Auth service is healthy' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return JWT tokens',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully authenticated',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'Authenticated' },
            data: { type: 'object', $ref: getSchemaPath(LoginResponseDataDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 401 },
            success: { example: false },
            action: { example: 'CANCEL' },
            message: { example: 'Incorrect username or password' },
            data: { type: 'object', example: {} },
          },
        },
      ],
    },
  })
  async login(
    @Body() dto: LoginUserDto,
  ): Promise<{ data: LoginResponseDataDto; message: string }> {
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
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset code to user email',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if email exists)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: {
              example:
                'If that email address is in our database, we will send you an email to reset your password',
            },
            data: { $ref: getSchemaPath(ForgotPasswordResponseDataDto) },
          },
        },
      ],
    },
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ data: ForgotPasswordResponseDataDto; message: string }> {
    const data = await this.authSvc.forgotPassword(dto);
    return {
      data,
      message:
        'If that email address is in our database, we will send you an email to reset your password',
    };
  }

  @Post('confirm-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm password reset',
    description: 'Reset password using the code sent via email',
  })
  @ApiBody({ type: ConfirmForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully changed',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'Password changed successfully' },
            data: { $ref: getSchemaPath(ConfirmPasswordResponseDataDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired code',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 400 },
            success: { example: false },
            action: { example: 'CANCEL' },
            message: { example: 'Invalid or expired code' },
            data: { type: 'object', example: {} },
          },
        },
      ],
    },
  })
  async confirmPassword(@Body() dto: ConfirmForgotPasswordDto) {
    const data = await this.authSvc.confirmForgotPassword(dto);
    return {
      data,
      message: 'Password changed successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'Token refreshed' },
            data: { $ref: getSchemaPath(RefreshTokenResponseDataDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 401 },
            success: { example: false },
            action: { example: 'CANCEL' },
            message: { example: 'Invalid or expired refresh token' },
            data: { type: 'object', example: {} },
          },
        },
      ],
    },
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    const data: AuthTokens = await this.authSvc.refresh(dto);
    return { message: 'Token refreshed', data };
  }
}
