import {
  AuthenticationResultType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ForgotPasswordCommand,
  ForgotPasswordCommandOutput,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthTokens,
  ConfirmForgotPasswordDto,
  ForgotPasswordDto,
  LoginUserDto,
  RefreshTokenDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;

  constructor(
    private readonly configSvc: ConfigService,
    client: CognitoIdentityProviderClient,
  ) {
    this.client = client;
    this.clientId = this.configSvc.getOrThrow<string>('cognito.clientId');
  }

  async login(dto: LoginUserDto): Promise<AuthTokens> {
    this.logger.log(`Logging in user: ${dto.email}`);
    try {
      const username: string = dto.email.trim().toLowerCase();
      const response: InitiateAuthCommandOutput = await this.client.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: dto.password,
          },
        }),
      );

      if (response.ChallengeName) {
        return { challengeName: response.ChallengeName };
      }

      const auth = response.AuthenticationResult;
      if (!auth) {
        throw new UnauthorizedException('Invalid authorization');
      }

      return {
        accessToken: auth.AccessToken,
        idToken: auth.IdToken,
        refreshToken: auth.RefreshToken,
        expiresIn: auth.ExpiresIn,
        tokenType: auth.TokenType,
      };
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        typeof (err as { name?: string }).name === 'string'
          ? (err as { name: string }).name
          : 'Authentication failed';

      if (message === 'NotAuthorizedException') {
        this.logger.warn(`Incorrect username or password for: ${dto.email}`);
        throw new UnauthorizedException('Incorrect username or password');
      }
      if (message === 'UserNotFoundException') {
        this.logger.warn(`User with email not found: ${dto.email}`);
        throw new UnauthorizedException('User not found');
      }
      throw new UnauthorizedException(message);
    }
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ delivery?: unknown }> {
    this.logger.log(`Initiating forgot password for user: ${dto.email}`);
    try {
      const response: ForgotPasswordCommandOutput = await this.client.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );

      return { delivery: response.CodeDeliveryDetails };
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        typeof (err as { name?: string }).name === 'string'
          ? (err as { name: string }).name
          : 'Failed to initiate password reset';
      if (message === 'UserNotFoundException') {
        this.logger.warn(`User with email not found: ${dto.email}`);
        return { delivery: undefined };
      }
      this.logger.error('Failed to initiate password reset', err as Error);
      throw new BadRequestException(message);
    }
  }

  async confirmForgotPassword(
    dto: ConfirmForgotPasswordDto,
  ): Promise<{ success: true }> {
    this.logger.log(`Confirming forgot password for user: ${dto.email}`);
    try {
      await this.client.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
          Password: dto.newPassword,
        }),
      );

      return { success: true };
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        typeof (err as { name?: string }).name === 'string'
          ? (err as { name: string }).name
          : 'Failed to confirm password reset';
      if (
        message === 'ExpiredCodeException' ||
        message === 'CodeMismatchException'
      ) {
        this.logger.warn(`Expired or invalid code for: ${dto.email}`);
        throw new BadRequestException('Invalid or expired code');
      }
      if (message === 'InvalidPasswordException') {
        this.logger.warn(`Password does not meet policy for: ${dto.email}`);
        throw new BadRequestException('Password does not meet policy');
      }
      this.logger.error('Failed to confirm password reset', err as Error);
      throw new BadRequestException(message);
    }
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    this.logger.log(`Refreshing token`);
    try {
      const resp = await this.client.send(
        new InitiateAuthCommand({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            REFRESH_TOKEN: dto.refreshToken,
          },
        }),
      );

      const auth: AuthenticationResultType | undefined =
        resp.AuthenticationResult;
      if (!auth) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        accessToken: auth.AccessToken,
        idToken: auth.IdToken,
        refreshToken: dto.refreshToken,
        expiresIn: auth.ExpiresIn,
        tokenType: auth.TokenType,
      };
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        typeof (err as { name?: string }).name === 'string'
          ? (err as { name: string }).name
          : 'Failed to refresh token';
      if (message === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw new UnauthorizedException(message);
    }
  }
}
