/**
 * @waitingliou/ts-otel-weaver
 * 
 * Zero-touch business-logic tracing for TypeScript via compile-time AST weaving.
 * Automatic OpenTelemetry instrumentation through TypeScript transformer.
 */

// ====================================================
// Core API - TypeScript Transformer
// ====================================================
export { createTracingTransformer, default } from './transformer/index.js';

// ====================================================
// Type Definitions
// ====================================================
export type { 
  TracingConfig, 
  TransformContext, 
  ValidationResult, 
  TransformError 
} from './transformer/types.js';

// ====================================================
// Utility Exports (for advanced usage)
// ====================================================
export {
  validateConfig,
  createTransformError,
  logger,
  setLogLevel
} from './transformer/validation.js';

export {
  loadConfig,
  shouldTransformFile,
  shouldInstrumentMethod
} from './transformer/config-loader.js';
