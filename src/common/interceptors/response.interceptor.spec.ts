import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { IDataResponse, IResponse } from '../interfaces';

// Build a minimal mock ExecutionContext for HTTP scenario
const createMockContext = (statusCode: number, url = '/test'): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({ statusCode }),
    }),
    getClass: () => ({}),
    getHandler: () => ({}),
    getArgByIndex: () => null,
    getArgs: () => [],
    getType: () => 'http',
  } as unknown as ExecutionContext);

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap a successful response with provided message and data', (done) => {
    const context = createMockContext(200, '/items');
    const payload: IDataResponse = { data: { foo: 'bar' }, message: 'Custom ok' };

    interceptor
      .intercept(context, { handle: () => of(payload) })
      .subscribe((wrapped: IResponse) => {
        expect(wrapped.statusCode).toBe(200);
        expect(wrapped.success).toBe(true);
        expect(wrapped.path).toBe('/items');
        expect(wrapped.action).toBe('CONTINUE');
        expect(wrapped.message).toBe('Custom ok');
        expect(wrapped.data).toEqual({ foo: 'bar' });
        expect(typeof wrapped.timestamp).toBe('number');
        done();
      });
  });

  it('should supply default message when none is provided', (done) => {
    const context = createMockContext(200, '/default');
    const payload: IDataResponse = { data: { value: 1 } }; // no message

    interceptor
      .intercept(context, { handle: () => of(payload) })
      .subscribe((wrapped: IResponse) => {
        expect(wrapped.message).toBe('Request completed');
        expect(wrapped.data).toEqual({ value: 1 });
        expect(wrapped.success).toBe(true);
        done();
      });
  });

  it('should reflect failure when response statusCode >= 400', (done) => {
    const context = createMockContext(404, '/not-found');
    const payload: IDataResponse = { data: {}, message: 'Resource missing' };

    interceptor
      .intercept(context, { handle: () => of(payload) })
      .subscribe((wrapped: IResponse) => {
        expect(wrapped.statusCode).toBe(404);
        expect(wrapped.success).toBe(false);
        expect(wrapped.action).toBe('CANCEL');
        expect(wrapped.message).toBe('Resource missing');
        expect(wrapped.path).toBe('/not-found');
        expect(wrapped.data).toEqual({});
        expect(typeof wrapped.timestamp).toBe('number');
        done();
      });
  });

  it('should wrap non-HttpException errors into HttpException with structured body', (done) => {
    const context = createMockContext(200, '/error');
    const underlyingError = new Error('Boom');

    interceptor
      .intercept(context, { handle: () => throwError(() => underlyingError) })
      .subscribe({
        next: () => done.fail('Expected error, got success'),
        error: (err: unknown) => {
          expect(err).toBeInstanceOf(HttpException);
          const httpErr = err as HttpException;
            const body = httpErr.getResponse() as Record<string, unknown>;
            expect(body).toMatchObject({
              statusCode: 500,
              success: false,
              path: '/error',
              action: 'CANCEL',
              message: 'Boom',
              data: {},
            });
            expect(typeof body.timestamp).toBe('number');
            done();
        },
      });
  });

  it('should preserve HttpException status and message', (done) => {
    const context = createMockContext(200, '/existing-http');
    const underlying = new HttpException('Forbidden', 403);

    interceptor
      .intercept(context, { handle: () => throwError(() => underlying) })
      .subscribe({
        next: () => done.fail('Expected error, got success'),
        error: (err: unknown) => {
          expect(err).toBeInstanceOf(HttpException);
          const httpErr = err as HttpException;
          const body = httpErr.getResponse() as Record<string, unknown>;
          expect(body).toMatchObject({
            statusCode: 403,
            success: false,
            path: '/existing-http',
            action: 'CANCEL',
            message: 'Forbidden',
            data: {},
          });
          done();
        },
      });
  });
});
