import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoJwtStrategy } from './strategies/cognito.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigurationModule } from '@config/configuration';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigurationModule,
  ],
  providers: [CognitoJwtStrategy, AuthService, RolesGuard],
  exports: [PassportModule, RolesGuard],
  controllers: [AuthController],
})
export class AuthModule {}
