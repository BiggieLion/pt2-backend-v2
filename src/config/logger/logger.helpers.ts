import { trace, context } from '@opentelemetry/api';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';

/**
 * Pino mixin that injects OpenTelemetry trace context into every log line.
 * Called on every log call — kept intentionally lightweight (~microseconds).
 */
export function otelMixin(): Record<string, string | undefined> {
  const span = trace.getSpan(context.active());
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

/**
 * Pino genReqId that reads the correlation ID set by CorrelationIdMiddleware.
 * Falls back to a random UUID if middleware hasn't run (e.g. early errors).
 */
export function genReqId(req: IncomingMessage): string {
  return (req as IncomingMessage & { id?: string }).id ?? randomUUID();
}
