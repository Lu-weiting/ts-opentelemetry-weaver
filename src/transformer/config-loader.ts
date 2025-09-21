import { TracingConfig, DEFAULT_CONFIG, TransformError } from './types.js';
import { validateConfig, createTransformError, logger, setLogLevel } from './validation.js';

/**
 * Loads and validates transformer configuration
 */
export function loadConfig(userConfig?: Partial<TracingConfig>): TracingConfig {
  const config: TracingConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  // Set up logging
  if (config.logLevel) {
    setLogLevel(config.logLevel);
  }

  if (config.debug) {
    setLogLevel('debug');
  }

  logger.debug('Loading transformer configuration:', config);

  // Validate configuration
  const validation = validateConfig(config);
  
  if (!validation.isValid) {
    const errorMessage = `Invalid transformer configuration: ${validation.errors.join(', ')}`;
    logger.error(errorMessage);
    throw createTransformError(TransformError.CONFIG_INVALID, errorMessage);
  }

  // Log warnings
  for (const warning of validation.warnings) {
    logger.warn(`Configuration warning: ${warning}`);
  }

  logger.info('Transformer configuration loaded successfully');
  return config;
}

/**
 * Checks if a file should be transformed based on include/exclude patterns
 */
export function shouldTransformFile(fileName: string, config: TracingConfig): boolean {
  // Normalize path separators
  const normalizedFileName = fileName.replace(/\\/g, '/');
  
  // Check exclude patterns first
  const isExcluded = config.exclude.some(pattern => {
    const regex = createGlobRegex(pattern);
    return regex.test(normalizedFileName);
  });
  
  if (isExcluded) {
    return false;
  }
  
  // Check include patterns
  const isIncluded = config.include.some(pattern => {
    const regex = createGlobRegex(pattern);
    return regex.test(normalizedFileName);
  });
  
  return isIncluded;
}

/**
 * Check if method name matches any pattern in the array
 * Supports exact strings and glob patterns (* and ?)
 */
function matchesMethodPattern(methodName: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // If pattern contains glob characters, use glob matching
    if (pattern.includes('*') || pattern.includes('?')) {
      return createMethodGlobRegex(pattern).test(methodName);
    }
    // Otherwise, exact string match
    return pattern === methodName;
  });
}

/**
 * Convert glob pattern to regex for method name matching
 * Supports: * (zero or more chars), ? (single char)
 * Note: Method names don't use path separators, so simpler than file glob
 */
function createMethodGlobRegex(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape special chars
    .replace(/\*/g, '.*')                   // * becomes .*
    .replace(/\?/g, '.');                   // ? becomes .
  
  return new RegExp(`^${escaped}$`);
}

/**
 * Checks if a method should be instrumented based on configuration with glob pattern support
 */
export function shouldInstrumentMethod(methodName: string, config: TracingConfig): boolean {
  // Skip private methods if not configured to instrument them
  if (!config.instrumentPrivateMethods && methodName.startsWith('_')) {
    return false;
  }
  
  // If include methods is specified, only instrument those (highest priority)
  if (config.includeMethods && config.includeMethods.length > 0) {
    return matchesMethodPattern(methodName, config.includeMethods);
  }
  
  // Check exclude methods
  if (config.excludeMethods && config.excludeMethods.length > 0) {
    if (matchesMethodPattern(methodName, config.excludeMethods)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Converts a glob pattern to a regular expression
 */
function createGlobRegex(pattern: string): RegExp {
  // Escape special regex characters except * and **
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__') // Temporary placeholder for **
    .replace(/\*/g, '[^/]*') // * matches anything except /
    .replace(/__DOUBLE_STAR__/g, '.*'); // ** matches anything including /
  
  // For patterns starting with **, make the leading part optional
  if (pattern.startsWith('**/')) {
    regexPattern = regexPattern.replace(/^\.\*\//, '(.*\/)?');
  }
  
  // Anchor the pattern
  regexPattern = '^' + regexPattern + '$';
  
  return new RegExp(regexPattern);
}
