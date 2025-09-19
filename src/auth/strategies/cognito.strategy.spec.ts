import { ConfigService } from '@nestjs/config';
import { CognitoJwtStrategy } from './cognito.strategy';

describe('CognitoJwtStrategy', () => {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'cognito.clientId': 'client-123',
        'cognito.authority': 'https://example.com',
      };
      return map[key];
    }),
  } as unknown as ConfigService;

  it('should map payload with id token correctly', () => {
    const strat = new CognitoJwtStrategy(config);
    const user = strat.validate({
      sub: 'abc',
      email: 'a@b.com',
      name: 'Alice',
      'cognito:groups': ['admin'],
      token_use: 'id',
    });
    expect(user).toEqual({
      id: 'abc',
      name: 'Alice',
      email: 'a@b.com',
      rol: 'admin',
    });
  });

  it('should default role when no groups present', () => {
    const strat = new CognitoJwtStrategy(config);
    const user = strat.validate({
      sub: 'u1',
      'cognito:username': 'user1',
      token_use: 'access',
    });
    expect(user).toEqual({
      id: 'u1',
      name: 'user1',
      email: 'No email',
      rol: 'default',
    });
  });

  it('should throw when token_use is invalid', () => {
    const strat = new CognitoJwtStrategy(config);
    expect(() =>
      strat.validate({ sub: 'x', token_use: 'other' as unknown as 'id' }),
    ).toThrow(/Invalid token use/);
  });
});
