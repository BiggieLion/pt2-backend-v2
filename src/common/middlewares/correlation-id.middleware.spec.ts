/* eslint-disable @typescript-eslint/unbound-method -- jest mocks are not real method references */
import {
  CorrelationIdMiddleware,
  sanitizeCorrelationId,
} from './correlation-id.middleware';
import { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '@config/tracing';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createMockReqRes(
  headers: Record<string, string | string[] | undefined> = {},
) {
  const req = {
    headers,
    id: undefined as string | undefined,
  } as unknown as Request;

  const resHeaders: Record<string, string> = {};
  const res = {
    setHeader: jest.fn((key: string, value: string) => {
      resHeaders[key] = value;
    }),
    _headers: resHeaders,
  } as unknown as Response;

  const next = jest.fn();
  return { req, res, next, resHeaders };
}

describe('sanitizeCorrelationId', () => {
  it('deberia retornar el string limpio cuando es valido', () => {
    expect(sanitizeCorrelationId('abc-123')).toBe('abc-123');
  });

  it('deberia hacer trim del valor', () => {
    expect(sanitizeCorrelationId('  abc-123  ')).toBe('abc-123');
  });

  it('deberia retornar undefined cuando el string esta vacio', () => {
    expect(sanitizeCorrelationId('')).toBeUndefined();
  });

  it('deberia retornar undefined cuando el string tiene solo espacios', () => {
    expect(sanitizeCorrelationId('   ')).toBeUndefined();
  });

  it('deberia retornar undefined cuando excede 128 caracteres', () => {
    const longValue = 'a'.repeat(129);
    expect(sanitizeCorrelationId(longValue)).toBeUndefined();
  });

  it('deberia aceptar exactamente 128 caracteres', () => {
    const exactValue = 'a'.repeat(128);
    expect(sanitizeCorrelationId(exactValue)).toBe(exactValue);
  });

  it('deberia eliminar caracteres de control', () => {
    expect(sanitizeCorrelationId('abc\x00\x1f\x7fdef')).toBe('abcdef');
  });

  it('deberia retornar undefined si solo tiene caracteres de control', () => {
    expect(sanitizeCorrelationId('\x00\x1f\x7f')).toBeUndefined();
  });

  it('deberia eliminar secuencias CRLF para prevenir header injection', () => {
    expect(sanitizeCorrelationId('abc\r\ndef')).toBe('abcdef');
  });
});

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('deberia generar un UUID cuando no hay header x-correlation-id', () => {
    const { req, res, next } = createMockReqRes();

    middleware.use(req, res, next);

    expect(req.id).toBeDefined();
    expect(req.id).toMatch(UUID_V4_REGEX);
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.id);
    expect(next).toHaveBeenCalled();
  });

  it('deberia usar el header x-correlation-id cuando es un string valido', () => {
    const customId = 'my-custom-correlation-id';
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: customId,
    });

    middleware.use(req, res, next);

    expect(req.id).toBe(customId);
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, customId);
    expect(next).toHaveBeenCalled();
  });

  it('deberia generar un UUID cuando el header esta vacio', () => {
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: '',
    });

    middleware.use(req, res, next);

    expect(req.id).toMatch(UUID_V4_REGEX);
    expect(next).toHaveBeenCalled();
  });

  it('deberia generar un UUID cuando el header contiene solo espacios', () => {
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: '   ',
    });

    middleware.use(req, res, next);

    expect(req.id).toMatch(UUID_V4_REGEX);
    expect(next).toHaveBeenCalled();
  });

  it('deberia usar el primer valor cuando el header es un array', () => {
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: ['first-id', 'second-id'],
    });

    middleware.use(req, res, next);

    expect(req.id).toBe('first-id');
    expect(next).toHaveBeenCalled();
  });

  it('deberia hacer trim del valor del header', () => {
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: '  trimmed-id  ',
    });

    middleware.use(req, res, next);

    expect(req.id).toBe('trimmed-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      'trimmed-id',
    );
    expect(next).toHaveBeenCalled();
  });

  it('deberia generar UUID cuando el header excede 128 caracteres', () => {
    const longId = 'x'.repeat(200);
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: longId,
    });

    middleware.use(req, res, next);

    expect(req.id).toMatch(UUID_V4_REGEX);
    expect(next).toHaveBeenCalled();
  });

  it('deberia eliminar caracteres de control del header', () => {
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: 'safe\x00id',
    });

    middleware.use(req, res, next);

    expect(req.id).toBe('safeid');
    expect(next).toHaveBeenCalled();
  });

  it('deberia generar UUID cuando el header solo tiene caracteres de control', () => {
    const { req, res, next } = createMockReqRes({
      [CORRELATION_ID_HEADER]: '\r\n\x00',
    });

    middleware.use(req, res, next);

    expect(req.id).toMatch(UUID_V4_REGEX);
    expect(next).toHaveBeenCalled();
  });

  it('deberia setear el correlation ID en el response header', () => {
    const { req, res, next } = createMockReqRes();

    middleware.use(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      expect.any(String),
    );
    expect(next).toHaveBeenCalled();
  });
});
