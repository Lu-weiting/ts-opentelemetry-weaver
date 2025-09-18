import { AttributeValue, SpanKind } from '@opentelemetry/api';

/**
 * Configuration for tracing a single service instance
 */
export interface ServiceTracingConfig {
  /** Service name for span naming and attributes */
  serviceName: string;
  
  /** 
   * Custom tracer name for this instrumentation
   * @default '@pathors/otel-instrumentation'
   */
  tracerName?: string;
  
  /** 
   * Common attributes to add to all spans
   */
  commonAttributes?: Record<string, AttributeValue>;
  
  /** 
   * Whether to record method arguments as span attributes
   * WARNING: This may log sensitive data
   * @default false
   */
  recordArguments?: boolean;
  
  /** 
   * Whether to record method return values as span attributes
   * WARNING: This may log sensitive data
   * @default false
   */
  recordReturnValue?: boolean;
  
  /** 
   * Span kind for all traced methods
   * @default SpanKind.INTERNAL
   */
  spanKind?: SpanKind;
  
  /** 
   * Filter function to include specific methods for tracing
   * @param method - Method name
   * @returns true if method should be traced
   */
  includeMethods?: (method: string) => boolean;
  
  /** 
   * Filter function to exclude specific methods from tracing
   * @param method - Method name
   * @returns true if method should be excluded
   */
  excludeMethods?: (method: string) => boolean;
  
  /** 
   * Function to generate method-specific attributes
   * @param method - Method name
   * @param args - Method arguments (be careful with sensitive data)
   * @returns Attributes to add to the span
   */
  methodAttributes?: (method: string, args: any[]) => Record<string, AttributeValue> | void;
}
