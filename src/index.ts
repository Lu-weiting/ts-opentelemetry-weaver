/**
 * @pathors/otel-instrumentation
 * 
 * OpenTelemetry instrumentation for Pathors services with automatic method tracing
 * using both Proxy-based interception and compile-time AST transformation.
 */

// ====================================================
// Core Functions (Primary API)
// ====================================================
// Proxy-based tracing (runtime)
export { traceService } from './traceService';

// AST transformer (compile-time) - re-export from transformer
export { createTracingTransformer } from './transformer/index.js';

// ====================================================
// Type Definitions
// ====================================================
export type { ServiceTracingConfig } from './types';
export type { TracingConfig } from './transformer/index.js';

// ====================================================
// Runtime Utilities
// ====================================================
export { tracer, getTracer } from './runtime/index.js';

// ====================================================
// Utility Exports (for advanced usage)
// ====================================================
export {
  safeStringify,
  recordError,
  type SafeSerializationOptions,
  type ErrorRecordingOptions
} from './utils';

// ====================================================
// Default Export (Proxy-based for backward compatibility)
// ====================================================
export { traceService as default } from './traceService';
