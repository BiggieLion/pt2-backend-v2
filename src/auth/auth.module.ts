import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoJwtStrategy } from './strategies/cognito.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigurationModule } from '@config/configuration';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigurationModule,
  ],
  providers: [CognitoJwtStrategy, AuthService],
  exports: [PassportModule],
  controllers: [AuthController],
})
export class AuthModule {}
