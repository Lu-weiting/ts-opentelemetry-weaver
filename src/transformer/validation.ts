import { TracingConfig, ValidationResult, TransformError } from './types.js';

/**
 * Validates transformer configuration
 */
export function validateConfig(config: Partial<TracingConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate include patterns
  if (!config.include || !Array.isArray(config.include) || config.include.length === 0) {
    errors.push('include patterns are required and must be a non-empty array');
  } else {
    for (const pattern of config.include) {
      if (typeof pattern !== 'string' || pattern.trim() === '') {
        errors.push(`Invalid include pattern: ${pattern}`);
      }
    }
  }

  // Validate exclude patterns
  if (config.exclude && !Array.isArray(config.exclude)) {
    errors.push('exclude must be an array of strings');
  } else if (config.exclude) {
    for (const pattern of config.exclude) {
      if (typeof pattern !== 'string') {
        errors.push(`Invalid exclude pattern: ${pattern}`);
      }
    }
  }

  // Validate spanNamePrefix
  if (config.spanNamePrefix && typeof config.spanNamePrefix !== 'string') {
    errors.push('spanNamePrefix must be a string');
  } else if (config.spanNamePrefix && config.spanNamePrefix.trim() === '') {
    warnings.push('spanNamePrefix is empty, consider providing a meaningful prefix');
  }

  // Validate maxMethodsPerFile
  if (config.maxMethodsPerFile !== undefined) {
    if (typeof config.maxMethodsPerFile !== 'number' || config.maxMethodsPerFile < 1) {
      errors.push('maxMethodsPerFile must be a positive number');
    } else if (config.maxMethodsPerFile > 1000) {
      warnings.push('maxMethodsPerFile is very high, this might impact performance');
    }
  }

  // Validate logLevel
  if (config.logLevel && !['none', 'error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
    errors.push('logLevel must be one of: none, error, warn, info, debug');
  }

  // Validate method filters
  if (config.excludeMethods && !Array.isArray(config.excludeMethods)) {
    errors.push('excludeMethods must be an array of strings');
  }

  if (config.includeMethods && !Array.isArray(config.includeMethods)) {
    errors.push('includeMethods must be an array of strings');
  }

  // Validate commonAttributes
  if (config.commonAttributes && typeof config.commonAttributes !== 'object') {
    errors.push('commonAttributes must be an object');
  } else if (config.commonAttributes) {
    for (const [key, value] of Object.entries(config.commonAttributes)) {
      if (typeof key !== 'string' || typeof value !== 'string') {
        errors.push(`commonAttributes values must be strings. Invalid: ${key}=${value}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


/**
 * Simple logger for transformer
 */
export class TransformLogger {
  constructor(private logLevel: string = 'warn') {}

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('[ts-otel-weaver:error]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[ts-otel-weaver:warn]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info('[ts-otel-weaver:info]', ...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug('[ts-otel-weaver:debug]', ...args);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['none', 'error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex > 0 && messageLevelIndex <= currentLevelIndex;
  }
}

// Global logger instance
export const logger = new TransformLogger();

/**
 * Updates logger configuration
 */
export function setLogLevel(level: string): void {
  (logger as any).logLevel = level;
}

/**
 * Creates a transform error with additional context
 */
export function createTransformError(
  type: TransformError,
  message: string,
  sourceFile?: string,
  details?: any
): Error {
  const error = new Error(`${type}: ${message}`);
  (error as any).type = type;
  (error as any).sourceFile = sourceFile;
  (error as any).details = details;
  return error;
}
