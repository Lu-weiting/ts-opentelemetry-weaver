import { TracingConfig, DEFAULT_CONFIG } from './types.js';

/**
 * Loads and validates transformer configuration
 */
export function loadConfig(userConfig?: Partial<TracingConfig>): TracingConfig {
  const config: TracingConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  // Validate configuration
  if (!config.include || config.include.length === 0) {
    throw new Error('TracingConfig.include must contain at least one pattern');
  }

  if (!config.spanNamePrefix) {
    throw new Error('TracingConfig.spanNamePrefix must be provided');
  }

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
 * Checks if a method should be instrumented
 */
export function shouldInstrumentMethod(methodName: string, config: TracingConfig): boolean {
  // Skip private methods if not configured to instrument them
  if (!config.instrumentPrivateMethods && methodName.startsWith('_')) {
    return false;
  }
  
  // Check exclude methods
  if (config.excludeMethods?.includes(methodName)) {
    return false;
  }
  
  // If include methods is specified, only instrument those
  if (config.includeMethods && config.includeMethods.length > 0) {
    return config.includeMethods.includes(methodName);
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
