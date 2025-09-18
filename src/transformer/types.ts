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
}

/**
 * Default configuration for the transformer
 */
export const DEFAULT_CONFIG: TracingConfig = {
  include: ['**/*service.ts', '**/*repository.ts', '**/*manager.ts'],
  exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  instrumentPrivateMethods: true,
  spanNamePrefix: 'pathors',
  autoInjectTracer: true,
  excludeMethods: [
    'constructor',
    'toString',
    'valueOf',
    'toJSON',
    'inspect',
  ],
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
