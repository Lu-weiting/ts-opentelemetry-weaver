/**
 * TypeScript Transformer entry point
 * This file is used by TypeScript compiler to load the transformer
 */

const path = require('path');

function loadTransformer() {
  try {
    // Try to load from dist directory
    const transformerPath = path.join(__dirname, 'dist', 'transformer', 'index.js');
    const { createTracingTransformer } = require(transformerPath);
    return createTracingTransformer;
  } catch (error) {
    console.error('[Pathors Transformer] Failed to load transformer:', error.message);
    console.error('[Pathors Transformer] Make sure to run "npm run build" in @pathors/otel-instrumentation');
    
    // Return a no-op transformer
    return function() {
      return function(context) {
        return function(sourceFile) {
          return sourceFile;
        };
      };
    };
  }
}

// Export transformer factory function
module.exports = function(program, config) {
  const createTransformer = loadTransformer();
  return createTransformer(program, config);
};

// Also export as default for compatibility
module.exports.default = module.exports;

