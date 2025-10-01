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
  }

  validate(payload: JwtToken): UserDto {
    if (payload.token_use !== 'access') {
      throw new UnauthorizedException('Invalid token use');
    }

    const rol: string =
      Array.isArray(payload['cognito:groups']) &&
      payload['cognito:groups'].length > 0
        ? payload['cognito:groups'][0]
        : 'default';

    return {
      id: payload.sub,
      name: payload.name ?? payload['cognito:username'] ?? 'No name',
      email: payload.email ?? 'No email',
      rol,
    };
  }
}
