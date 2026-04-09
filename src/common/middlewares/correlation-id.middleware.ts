import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { trace, context, propagation } from '@opentelemetry/api';
import { CORRELATION_ID_HEADER } from '@config/tracing';

const MAX_CORRELATION_ID_LENGTH = 128;
// Strip control characters (U+0000–U+001F, U+007F–U+009F) to prevent log/header injection
// eslint-disable-next-line no-control-regex -- intentionally matching control characters for sanitization
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f-\x9f]/g;

function sanitizeCorrelationId(raw: string): string | undefined {
  const sanitized = raw.trim().replace(CONTROL_CHARS_REGEX, '');
  if (sanitized.length === 0 || sanitized.length > MAX_CORRELATION_ID_LENGTH) {
    return undefined;
  }
  return sanitized;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[CORRELATION_ID_HEADER];
    const rawValue = Array.isArray(incoming) ? incoming[0] : incoming;

    const correlationId =
      typeof rawValue === 'string'
        ? (sanitizeCorrelationId(rawValue) ?? randomUUID())
        : randomUUID();

    req.id = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttribute('correlation.id', correlationId);
    }

    const baggage = propagation.createBaggage({
      'correlation.id': { value: correlationId },
    });
    const ctx = propagation.setBaggage(context.active(), baggage);

    context.with(ctx, () => {
      next();
    });
  }
}

export { sanitizeCorrelationId };
