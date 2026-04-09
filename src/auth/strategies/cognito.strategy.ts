import { UserDto } from '@common/dto';
import { JwtToken } from '@common/interfaces';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';

import {
  ExtractJwt,
  Strategy as JwtStrategy,
  StrategyOptions,
} from 'passport-jwt';

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(JwtStrategy) {
  private readonly allowedGroups: string[];

  constructor(private readonly configSvc: ConfigService) {
    const clientId: string = configSvc.getOrThrow<string>('cognito.clientId');
    const issuer: string = configSvc.getOrThrow<string>('cognito.authority');

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: clientId,
      ignoreExpiration: false,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configSvc.getOrThrow<string>('cognito.authority')}/.well-known/jwks.json`,
      }),
    };
    super(opts);

    this.allowedGroups = [
      configSvc.getOrThrow<string>('cognito.requesterGroup'),
      configSvc.getOrThrow<string>('cognito.analystGroup'),
      configSvc.getOrThrow<string>('cognito.supervisorGroup'),
    ];
  }

  validate(payload: JwtToken): UserDto {
    if (payload.token_use !== 'access') {
      throw new UnauthorizedException('Invalid token use');
    }

    const tokenGroups: string[] = Array.isArray(payload['cognito:groups'])
      ? payload['cognito:groups']
      : [];

    const roles: string[] = tokenGroups.filter((g) =>
      this.allowedGroups.includes(g),
    );

    if (roles.length === 0) {
      throw new UnauthorizedException('No valid role assigned');
    }

    return {
      id: payload.sub,
      name: payload.name ?? payload['cognito:username'] ?? 'No name',
      email: payload.email ?? 'No email',
      roles,
    };
  }
}
