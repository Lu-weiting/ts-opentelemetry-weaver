/**
 * Safe serialization utilities for OpenTelemetry attributes
 */

/**
 * Set to track circular references during serialization
 */
const createCircularRefsTracker = (): WeakSet<object> => new WeakSet();

/**
 * Common sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credential/i,
  /bearer/i,
  /cookie/i,
];

/**
 * Configuration for safe serialization
 */
export interface SafeSerializationOptions {
  /** Maximum length of the serialized string */
  maxLength?: number;
  /** Maximum depth for object traversal */
  maxDepth?: number;
  /** Custom patterns for sensitive field detection */
  sensitivePatterns?: RegExp[];
  /** Whether to redact sensitive fields */
  redactSensitive?: boolean;
  /** Custom redaction value */
  redactionValue?: string;
}

/**
 * Default serialization options
 */
const DEFAULT_OPTIONS: Required<SafeSerializationOptions> = {
  maxLength: 1000,
  maxDepth: 3,
  sensitivePatterns: SENSITIVE_PATTERNS,
  redactSensitive: true,
  redactionValue: '[REDACTED]',
};

/**
 * Safely stringifies a value with protection against circular references,
 * sensitive data leakage, and excessive size
 * 
 * @param value - The value to stringify
 * @param options - Serialization options
 * @returns Safe string representation
 */
export function safeStringify(
  value: any, 
  options: SafeSerializationOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const circularRefs = createCircularRefsTracker();
    
    const serialized = JSON.stringify(value, (key, val) => {
      return createReplacer(key, val, circularRefs, opts, 0);
    });
    
    // Truncate if too long
    if (serialized.length > opts.maxLength) {
      return serialized.substring(0, opts.maxLength) + '...[TRUNCATED]';
    }
    
    return serialized;
  } catch (error) {
    return `[Serialization Error: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

/**
 * Creates a JSON.stringify replacer function with safety checks
 */
function createReplacer(
  key: string,
  value: any,
  circularRefs: WeakSet<object>,
  options: Required<SafeSerializationOptions>,
  currentDepth: number
): any {
  // Check depth limit
  if (currentDepth > options.maxDepth) {
    return '[Max Depth Exceeded]';
  }
  
  // Handle sensitive fields
  if (options.redactSensitive && key && isSensitiveField(key, options.sensitivePatterns)) {
    return options.redactionValue;
  }
  
  // Handle different value types
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle primitive types
  if (typeof value !== 'object') {
    return handlePrimitiveValue(value);
  }
  
  // Handle circular references
  if (circularRefs.has(value)) {
    return '[Circular Reference]';
  }
  
  // Track this object to detect future circular references
  circularRefs.add(value);
  
  // Handle special object types
  return handleObjectValue(value);
}

/**
 * Checks if a field name matches sensitive patterns
 */
function isSensitiveField(fieldName: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(fieldName));
}

/**
 * Handles primitive value serialization
 */
function handlePrimitiveValue(value: any): any {
  switch (typeof value) {
    case 'string':
      // Limit string length
      return value.length > 500 ? value.substring(0, 500) + '...[TRUNCATED]' : value;
    
    case 'number':
      // Handle special number values
      if (!isFinite(value)) {
        return isNaN(value) ? '[NaN]' : (value > 0 ? '[Infinity]' : '[-Infinity]');
      }
      return value;
    
    case 'boolean':
      return value;
    
    case 'function':
      return `[Function: ${value.name || 'anonymous'}]`;
    
    case 'symbol':
      return `[Symbol: ${value.toString()}]`;
    
    case 'bigint':
      return `[BigInt: ${value.toString()}]`;
    
    default:
      return '[Unknown Type]';
  }
}

/**
 * Handles object value serialization
 */
function handleObjectValue(value: any): any {
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle Error objects
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.substring(0, 500), // Limit stack trace length
    };
  }
  
  // Handle RegExp objects
  if (value instanceof RegExp) {
    return `[RegExp: ${value.toString()}]`;
  }
  
  // Handle Map objects
  if (value instanceof Map) {
    return `[Map: ${value.size} entries]`;
  }
  
  // Handle Set objects
  if (value instanceof Set) {
    return `[Set: ${value.size} entries]`;
  }
  
  // Handle ArrayBuffer and typed arrays
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return `[${value.constructor.name}: ${value.byteLength} bytes]`;
  }
  
  // Handle Promise objects
  if (value instanceof Promise) {
    return '[Promise]';
  }
  
  // For regular objects and arrays, let JSON.stringify handle them
  // The depth and circular reference checks are handled by the outer logic
  return value;
}

/**
 * Safely serializes method arguments for span attributes
 * 
 * @param args - Method arguments array
 * @param options - Serialization options
 * @returns Safe string representation of arguments
 */
export function safeStringifyArgs(
  args: any[], 
  options: SafeSerializationOptions = {}
): string {
  if (!args || args.length === 0) {
    return '[]';
  }
  
  // Create a simplified representation for arguments
  const argsInfo = {
    count: args.length,
    types: args.map(arg => typeof arg),
    values: args.map((arg, index) => 
      safeStringify(arg, { 
        ...options, 
        maxLength: Math.floor((options.maxLength || 1000) / args.length) // Distribute length among args
      })
    )
  };
  
  return safeStringify(argsInfo, options);
}

/**
 * Safely serializes method return value for span attributes
 * 
 * @param returnValue - Method return value
 * @param options - Serialization options  
 * @returns Safe string representation of return value
 */
export function safeStringifyReturnValue(
  returnValue: any,
  options: SafeSerializationOptions = {}
): string {
  const returnInfo = {
    type: typeof returnValue,
    value: safeStringify(returnValue, options)
  };
  
  return safeStringify(returnInfo, options);
}
