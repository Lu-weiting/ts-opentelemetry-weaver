/**
 * Utility functions for @pathors/otel-instrumentation
 */

// Serialization utilities
export {
  safeStringify,
  safeStringifyArgs,
  safeStringifyReturnValue,
  type SafeSerializationOptions,
} from './serialization';

// Error handling utilities
export {
  recordError,
  createErrorContext,
  type ErrorRecordingOptions,
} from './error-handling';



