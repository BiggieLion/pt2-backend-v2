import { otelMixin, genReqId } from './logger.helpers';
import {
  trace,
  type Span,
  type SpanContext,
  TraceFlags,
} from '@opentelemetry/api';
import type { IncomingMessage } from 'http';

describe('otelMixin', () => {
  it('deberia retornar trace_id y span_id cuando hay un span activo', () => {
    const mockSpanContext: SpanContext = {
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      traceFlags: TraceFlags.SAMPLED,
    };

    const mockSpan = {
      spanContext: () => mockSpanContext,
    } as unknown as Span;

    jest.spyOn(trace, 'getSpan').mockReturnValue(mockSpan);

    const result = otelMixin();

    expect(result).toEqual({
      trace_id: '4bf92f3577b34da6a3ce929d0e0e4736',
      span_id: '00f067aa0ba902b7',
    });

    jest.restoreAllMocks();
  });

  it('deberia retornar objeto vacio cuando no hay span activo', () => {
    jest.spyOn(trace, 'getSpan').mockReturnValue(undefined);

    const result = otelMixin();

    expect(result).toEqual({});

    jest.restoreAllMocks();
  });
});

describe('genReqId', () => {
  const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('deberia retornar req.id cuando esta definido', () => {
    const req = { id: 'existing-id' } as unknown as IncomingMessage;

    const result = genReqId(req);

    expect(result).toBe('existing-id');
  });

  it('deberia generar un UUID cuando req.id no esta definido', () => {
    const req = {} as IncomingMessage;

    const result = genReqId(req);

    expect(result).toMatch(UUID_V4_REGEX);
  });
});
