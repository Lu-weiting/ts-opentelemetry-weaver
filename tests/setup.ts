/**
 * Jest setup file for ts-otel-weaver tests
 */

// Set up test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities - extend jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSpanName(): R;
      toContainSpanAttributes(expected: Record<string, any>): R;
    }
  }
}

// Ensure this file is treated as a module
export {};

expect.extend({
  toBeValidSpanName(received: string) {
    const isValid = typeof received === 'string' && 
                   received.length > 0 && 
                   !received.includes(' ') &&
                   /^[a-zA-Z0-9._-]+$/.test(received);
    
    return {
      message: () => `expected ${received} to be a valid span name`,
      pass: isValid,
    };
  },

  toContainSpanAttributes(received: Record<string, any>, expected: Record<string, any>) {
    const hasAllAttributes = Object.entries(expected).every(([key, value]) => {
      return received[key] === value;
    });

    return {
      message: () => `expected span attributes to contain ${JSON.stringify(expected)}`,
      pass: hasAllAttributes,
    };
  },
});
