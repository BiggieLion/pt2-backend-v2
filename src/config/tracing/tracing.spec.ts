import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { buildExporter } from './tracing';

describe('buildExporter', () => {
  it('deberia retornar ConsoleSpanExporter cuando exporterType es "console"', () => {
    const exporter = buildExporter('console');
    expect(exporter).toBeInstanceOf(ConsoleSpanExporter);
  });

  it('deberia retornar OTLPTraceExporter cuando exporterType es "otlp" y hay endpoint', () => {
    const exporter = buildExporter('otlp', 'http://localhost:4318/v1/traces');
    expect(exporter).toBeInstanceOf(OTLPTraceExporter);
  });

  it('deberia retornar ConsoleSpanExporter con warning cuando exporterType es "otlp" sin endpoint', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const exporter = buildExporter('otlp');
    expect(exporter).toBeInstanceOf(ConsoleSpanExporter);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('falling back to console exporter'),
    );

    warnSpy.mockRestore();
  });

  it('deberia retornar ConsoleSpanExporter con warning cuando exporterType es desconocido', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const exporter = buildExporter('unknown-type');
    expect(exporter).toBeInstanceOf(ConsoleSpanExporter);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown OTEL_EXPORTER_TYPE'),
    );

    warnSpy.mockRestore();
  });
});
