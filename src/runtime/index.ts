/**
 * Runtime utilities for the transformed code
 * These are used by the generated instrumentation code
 */

export { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';

/**
 * Gets or creates a tracer instance for a given name
 */
export function getTracer(name: string = '@pathors/core') {
  const { trace } = require('@opentelemetry/api');
  return trace.getTracer(name);
}

/**
 * Default tracer instance
 */
export const tracer = getTracer();

