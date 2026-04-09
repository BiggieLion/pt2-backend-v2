/**
 * OpenTelemetry SDK bootstrap.
 *
 * This file reads `process.env` directly because OTel instrumentation MUST be
 * initialized before any other import (HTTP, Express, pg) is loaded. At this
 * point NestJS has not booted yet, so `ConfigService` is unavailable.
 * This is the ONLY file outside of `configuration.ts` where `process.env` is
 * acceptable — see CLAUDE.md "Patrones PROHIBIDOS §2" for context.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import type { SpanExporter } from '@opentelemetry/sdk-trace-node';

let sdk: NodeSDK | undefined;
let initialized = false;
let shutdownPromise: Promise<void> | undefined;

export function buildExporter(
  exporterType: string,
  otlpEndpoint?: string,
): SpanExporter {
  if (exporterType === 'otlp') {
    if (!otlpEndpoint) {
      console.warn(
        '[Tracing] OTEL_EXPORTER_TYPE=otlp but no OTEL_EXPORTER_OTLP_ENDPOINT set — falling back to console exporter',
      );
      return new ConsoleSpanExporter();
    }
    return new OTLPTraceExporter({ url: otlpEndpoint });
  }

  if (exporterType !== 'console') {
    console.warn(
      `[Tracing] Unknown OTEL_EXPORTER_TYPE "${String(exporterType)}" — falling back to console exporter`,
    );
  }

  return new ConsoleSpanExporter();
}

export function initTracing(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  const enabled = process.env.OTEL_TRACING_ENABLED !== 'false';
  if (!enabled) {
    console.log('[Tracing] Disabled via OTEL_TRACING_ENABLED=false');
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'pt2-backend';
  const exporterType = process.env.OTEL_EXPORTER_TYPE ?? 'console';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const exporter = buildExporter(exporterType, otlpEndpoint);

  sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  sdk.start();

  console.log(
    `[Tracing] Initialized — service: ${serviceName}, exporter: ${exporterType}`,
  );
}

export async function shutdownTracing(): Promise<void> {
  if (shutdownPromise) {
    return shutdownPromise;
  }
  if (!sdk) {
    return;
  }
  shutdownPromise = sdk.shutdown();
  return shutdownPromise;
}
