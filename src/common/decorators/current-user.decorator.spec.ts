import { ExecutionContext } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { extractCurrentUser } from './current-user.decorator';
import { UserDto } from '@common/dto';

// Create a real ExecutionContextHost so createParamDecorator recognizes it
const makeHttpContext = (user?: unknown): ExecutionContext => {
  const req = user !== undefined ? { user } : {};
  const host = new ExecutionContextHost([req, {}, () => undefined]);
  host.setType('http');
  return host;
};

describe('CurrentUser decorator', () => {
  it('should extract user from request', () => {
    const mockUser: UserDto = {
      id: '1',
      email: 'e@x.com',
      name: 'X',
      rol: 'r',
    };
    const ctx = makeHttpContext(mockUser);
    const result = extractCurrentUser(undefined, ctx);
    expect(result).toEqual(mockUser);
  });

  it('should return undefined when request has no user', () => {
    const ctx = makeHttpContext();
    const result = extractCurrentUser(undefined, ctx);
    expect(result).toBeUndefined();
  });

  it('should ignore provided data param and still return user', () => {
    const mockUser: UserDto = {
      id: '2',
      email: 'y@z.com',
      name: 'Y',
      rol: 'u',
    };
    const ctx = makeHttpContext(mockUser);
    const result = extractCurrentUser({ some: 'data' }, ctx);
    expect(result).toEqual(mockUser);
  });
});
