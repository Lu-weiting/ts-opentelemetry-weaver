/**
 * Transform error types for better error handling
 */
export enum TransformError {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  CONFIG_INVALID = 'CONFIG_INVALID',
  IMPORT_INJECTION_FAILED = 'IMPORT_INJECTION_FAILED',
  METHOD_WRAPPING_FAILED = 'METHOD_WRAPPING_FAILED'
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Log levels for debugging
 */
export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

/**
 * Configuration options for the TypeScript transformer
 */
export interface TracingConfig {
  /** Glob patterns for files to include in instrumentation */
  include: string[];
  
  /** Glob patterns for files to exclude from instrumentation */
  exclude: string[];
  
  /** Whether to instrument private methods (starting with _) */
  instrumentPrivateMethods: boolean;
  
  /** Prefix for span names */
  spanNamePrefix: string;
  
  /** Whether to automatically inject tracer imports */
  autoInjectTracer: boolean;
  
  /** Additional attributes to add to all spans */
  commonAttributes?: Record<string, string>;
  
  /** Method name patterns to exclude */
  excludeMethods?: string[];
  
  /** Method name patterns to include (if specified, only these will be instrumented) */
  includeMethods?: string[];
  
  /** Enable debug mode for transformer */
  debug?: boolean;
  
  /** Log level for transformer output */
  logLevel?: LogLevel;
  
  /** Maximum number of methods to instrument per file (safety limit) */
  maxMethodsPerFile?: number;
  
  /** Whether to include source map information in generated spans */
  includeSourceMap?: boolean;
}

/**
 * Default configuration for the transformer
 */
export const DEFAULT_CONFIG: TracingConfig = {
  include: ['**/*service.ts', '**/*repository.ts', '**/*manager.ts'],
  exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  instrumentPrivateMethods: true,
  spanNamePrefix: 'ts-otel-weaver',
  autoInjectTracer: true,
  excludeMethods: [
    'constructor',
    'toString',
    'valueOf',
    'toJSON',
    'inspect',
  ],
  debug: false,
  logLevel: 'warn',
  maxMethodsPerFile: 100,
  includeSourceMap: false,
};

/**
 * Context passed through the AST transformation
 */
export interface TransformContext {
  config: TracingConfig;
  sourceFile: string;
  hasTracerImport: boolean;
  className?: string;
}
