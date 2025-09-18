/**
 * Enhanced error handling utilities for OpenTelemetry spans
 */

import { Span, SpanStatusCode } from '@opentelemetry/api';
import { safeStringify } from './serialization';

/**
 * Error recording options
 */
export interface ErrorRecordingOptions {
  /** Maximum length for error messages */
  maxMessageLength?: number;
  /** Maximum length for stack traces */
  maxStackLength?: number;
  /** Whether to include stack trace */
  includeStack?: boolean;
  /** Additional context information */
  context?: Record<string, any>;
  /** Custom error type detection */
  errorTypeDetector?: (error: any) => string;
}

/**
 * Default error recording options
 */
const DEFAULT_ERROR_OPTIONS: Required<Omit<ErrorRecordingOptions, 'context' | 'errorTypeDetector'>> = {
  maxMessageLength: 500,
  maxStackLength: 1000,
  includeStack: true,
};

/**
 * Records an error in the span with comprehensive error handling
 * 
 * @param span - The OpenTelemetry span
 * @param error - The error to record
 * @param options - Error recording options
 * @param operationContext - Optional context about the operation that failed
 */
export function recordError(
  span: Span, 
  error: any, 
  options: ErrorRecordingOptions = {},
  operationContext?: string
): void {
  const opts = { ...DEFAULT_ERROR_OPTIONS, ...options };
  
  try {
    const errorInfo = analyzeError(error, opts);
    
    // Record the exception if it's a proper Error object
    if (error instanceof Error) {
      span.recordException(error);
    }
    
    // Set span status
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: truncateString(errorInfo.message, opts.maxMessageLength),
    });
    
    // Add comprehensive error attributes
    const errorAttributes: Record<string, any> = {
      'error.type': errorInfo.type,
      'error.message': truncateString(errorInfo.message, opts.maxMessageLength),
      'error.occurred_at': new Date().toISOString(),
    };
    
    // Add stack trace if available and requested
    if (opts.includeStack && errorInfo.stack) {
      errorAttributes['error.stack'] = truncateString(errorInfo.stack, opts.maxStackLength);
    }
    
    // Add operation context if provided
    if (operationContext) {
      errorAttributes['error.operation_context'] = operationContext;
    }
    
    // Add custom context if provided
    if (options.context) {
      try {
        errorAttributes['error.context'] = safeStringify(options.context, { maxLength: 300 });
      } catch {
        errorAttributes['error.context'] = '[Context serialization failed]';
      }
    }
    
    // Add error-specific attributes based on error type
    addErrorTypeSpecificAttributes(error, errorAttributes, errorInfo);
    
    span.setAttributes(errorAttributes);
    
  } catch (recordingError) {
    // Fallback error handling - ensure we don't break the application
    handleErrorRecordingFailure(span, error, recordingError, operationContext);
  }
}

/**
 * Analyzes an error to extract structured information
 */
function analyzeError(error: any, options: Required<Omit<ErrorRecordingOptions, 'context' | 'errorTypeDetector'>>): {
  type: string;
  message: string;
  stack?: string;
  originalError: any;
} {
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      type: error.constructor.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      originalError: error,
    };
  }
  
  // Handle error-like objects
  if (error && typeof error === 'object') {
    const message = extractErrorMessage(error);
    return {
      type: error.constructor?.name || 'Object',
      message,
      stack: error.stack || undefined,
      originalError: error,
    };
  }
  
  // Handle primitive values as errors
  const message = String(error || 'Unknown error');
  return {
    type: typeof error,
    message,
    originalError: error,
  };
}

/**
 * Extracts error message from error-like objects
 */
function extractErrorMessage(error: any): string {
  // Try common error message properties
  if (error.message) return String(error.message);
  if (error.msg) return String(error.msg);
  if (error.error) return String(error.error);
  if (error.reason) return String(error.reason);
  if (error.detail) return String(error.detail);
  
  // Try to stringify the error object
  try {
    return safeStringify(error, { maxLength: 200 });
  } catch {
    return '[Error message extraction failed]';
  }
}

/**
 * Adds error-type specific attributes to improve debugging
 */
function addErrorTypeSpecificAttributes(
  error: any, 
  attributes: Record<string, any>, 
  errorInfo: { type: string; originalError: any }
): void {
  // Handle network/fetch errors
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    attributes['error.category'] = 'network';
    attributes['error.fetch_related'] = true;
  }
  
  // Handle timeout errors
  if (error?.name === 'TimeoutError' || error?.message?.toLowerCase().includes('timeout')) {
    attributes['error.category'] = 'timeout';
  }
  
  // Handle validation errors
  if (error?.name === 'ValidationError' || error?.name === 'ZodError') {
    attributes['error.category'] = 'validation';
    if (error.issues) {
      attributes['error.validation_issues_count'] = error.issues.length;
    }
  }
  
  // Handle database errors
  if (error?.code && typeof error.code === 'string') {
    attributes['error.code'] = error.code;
    
    // Common database error patterns
    if (error.code.startsWith('P')) { // Prisma errors
      attributes['error.category'] = 'database';
      attributes['error.database_type'] = 'prisma';
    }
  }
  
  // Handle HTTP errors
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    attributes['error.http_status'] = status;
    attributes['error.category'] = 'http';
    
    if (status >= 400 && status < 500) {
      attributes['error.http_category'] = 'client_error';
    } else if (status >= 500) {
      attributes['error.http_category'] = 'server_error';
    }
  }
  
  // Handle AbortError (fetch cancellation)
  if (error?.name === 'AbortError') {
    attributes['error.category'] = 'cancellation';
  }
}

/**
 * Handles cases where error recording itself fails
 */
function handleErrorRecordingFailure(
  span: Span, 
  originalError: any, 
  recordingError: any, 
  operationContext?: string
): void {
  try {
    // Set minimal error status
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: 'Error recording failed',
    });
    
    // Add minimal attributes
    span.setAttributes({
      'error.recording_failed': true,
      'error.recording_error': String(recordingError?.message || recordingError),
      'error.original_error_type': typeof originalError,
      'error.original_error_string': String(originalError).substring(0, 100),
      ...(operationContext && { 'error.operation_context': operationContext }),
    });
    
  } catch (finalError) {
    // Last resort - just set error status without attributes
    try {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Critical error recording failure',
      });
    } catch {
      // If even this fails, there's nothing more we can do
      // The span will remain in an undefined state
    }
  }
}

/**
 * Safely truncates a string to the specified length
 */
function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - 12) + '...[TRUNCATED]';
}

/**
 * Creates a standardized error context object for common error scenarios
 */
export function createErrorContext(data: {
  method?: string;
  serviceName?: string;
  args?: any[];
  duration?: number;
  [key: string]: any;
}): Record<string, any> {
  const context: Record<string, any> = {};
  
  if (data.method) context.method = data.method;
  if (data.serviceName) context.service_name = data.serviceName;
  if (data.duration !== undefined) context.duration_ms = data.duration;
  if (data.args) {
    context.args_count = data.args.length;
    context.args_types = data.args.map(arg => typeof arg);
  }
  
  // Add any additional data
  Object.keys(data).forEach(key => {
    if (!['method', 'serviceName', 'args', 'duration'].includes(key)) {
      context[key] = data[key];
    }
  });
  
  return context;
}
