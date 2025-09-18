import { 
  SpanStatusCode, 
  trace, 
  Span,
  SpanKind 
} from '@opentelemetry/api';
import { ATTR_CODE_NAMESPACE, ATTR_CODE_FUNCTION } from './utils/semconv';
import type { ServiceTracingConfig } from './types';
import { version as PACKAGE_VERSION, name as PACKAGE_NAME } from '../package.json';
import { 
  recordError,
  createErrorContext,
} from './utils';
type AnyFn = (...args: any[]) => any;

const DEFAULT_EXCLUDED_METHODS = new Set([
  'constructor',
  'toString',
  'valueOf',
  'toJSON',
  'inspect',
  Symbol.iterator,
  Symbol.asyncIterator,
  Symbol.toPrimitive,
]);

// Type guards with improved checking
const isPromise = (v: any): v is Promise<any> => 
  v != null && typeof v.then === 'function';
  
const isAsyncIterable = (v: any): v is AsyncIterable<any> =>
  v != null && typeof v[Symbol.asyncIterator] === 'function';

/**
 * Wraps a service instance with OpenTelemetry tracing
 * 
 * @param instance - The service instance to wrap
 * @param config - Configuration options for tracing
 * @returns Proxied instance with automatic tracing
 */
export function traceService<T extends object>(instance: T, config: ServiceTracingConfig): T {
  
  const tracerName = config.tracerName ?? PACKAGE_NAME;
  const tracer = trace.getTracer(tracerName, PACKAGE_VERSION);
  const spanKind = config.spanKind ?? SpanKind.INTERNAL;

  return new Proxy(instance, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;

      const method = String(prop);
      
      // Skip private methods and common object methods
      if (DEFAULT_EXCLUDED_METHODS.has(method)) {
        return value;
      }
      
      // Apply filters
      if (config.excludeMethods?.(method)) return value;
      if (config.includeMethods && !config.includeMethods(method)) return value;

      const fn = value as AnyFn;
      const spanName = `${config.serviceName}.${method}`;

      // Use arrow function to preserve 'this' context
      const wrapped: AnyFn = (...args: any[]) => {
        return tracer.startActiveSpan(
          spanName, 
          { 
            kind: spanKind,
            attributes: {
              // Semantic conventions
              [ATTR_CODE_FUNCTION]: method,
              [ATTR_CODE_NAMESPACE]: config.serviceName,
              'pathors.service.name': config.serviceName,
              'pathors.service.method': method,
              'pathors.service.args.count': args.length,
            }
          },
          (span) => {
            try {
              // Add common attributes
              if (config.commonAttributes) {
                span.setAttributes(config.commonAttributes);
              }
              
              // Add method-specific attributes
              const extraAttributes = config.methodAttributes?.(method, args);
              if (extraAttributes) {
                span.setAttributes(extraAttributes);
              }
              
              // Record arguments if enabled (be careful with sensitive data)
              if (config.recordArguments && args.length > 0) {
                span.setAttribute('pathors.method.args', JSON.stringify(args));
              }

              // Call the original method with correct 'this' context
              const ret = fn.apply(target, args);

              if (isPromise(ret)) {
                return ret
                  .then((res) => {
                    if (isAsyncIterable(res)) {
                      return wrapAsyncIterable(res, span, config);
                    }
                    
                    // Record return value if enabled
                    if (config.recordReturnValue) {
                      try {
                        span.setAttribute('pathors.method.result', JSON.stringify(res));
                      } catch {
                        span.setAttribute('pathors.method.result', '[object]');
                      }
                    }
                    
                    span.setStatus({ code: SpanStatusCode.OK });
                    span.end();
                    return res;
                  })
                  .catch((err) => {
                    const errorContext = createErrorContext({
                      method,
                      serviceName: config.serviceName,
                      args
                    });
                    recordError(span, err, { context: errorContext }, `${config.serviceName}.${method}`);
                    span.end();
                    throw err;
                  });
              }

              if (isAsyncIterable(ret)) {
                return wrapAsyncIterable(ret, span, config);
              }

              // Record return value for synchronous calls
              if (config.recordReturnValue) {
                try {
                  span.setAttribute('pathors.method.result', JSON.stringify(ret));
                } catch {
                  span.setAttribute('pathors.method.result', '[object]');
                }
              }

              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
              return ret;
            } catch (err) {
              const errorContext = createErrorContext({
                method,
                serviceName: config.serviceName,
                args
              });
              recordError(span, err, { context: errorContext }, `${config.serviceName}.${method}`);
              span.end();
              throw err;
            }
          }
        );
      };
      
      return wrapped;
    },
  }) as T;
}

/**
 * Wraps an async iterable to properly handle span lifecycle
 */
async function* wrapAsyncIterable<T>(
  iterable: AsyncIterable<T>,
  span: Span,
  config: ServiceTracingConfig
): AsyncIterable<T> {
  let itemCount = 0;
  
  try {
    for await (const item of iterable) {
      itemCount++;
      
      // Add progress attributes periodically
      if (itemCount % 100 === 0) {
        span.setAttribute('pathors.stream.items_processed', itemCount);
      }
      
      yield item;
    }
    
    // Record final statistics
    span.setAttributes({
      'pathors.stream.items_total': itemCount,
      'pathors.stream.completed': true,
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setAttributes({
      'pathors.stream.items_processed': itemCount,
      'pathors.stream.completed': false,
    });
    
    const errorContext = createErrorContext({
      method: 'AsyncIterable',
      serviceName: config.serviceName,
      itemsProcessed: itemCount,
    });
    recordError(span, error, { context: errorContext }, 'AsyncIterable processing');
    throw error;
  } finally {
    span.end();
  }
}
