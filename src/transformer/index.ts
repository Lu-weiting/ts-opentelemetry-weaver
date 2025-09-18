import * as ts from 'typescript';
import { TracingConfig, TransformContext } from './types.js';
import { loadConfig, shouldTransformFile } from './config-loader.js';
import { createASTVisitor } from './ast-visitor.js';

/**
 * Creates the main TypeScript transformer for automatic tracing instrumentation 
 * 編譯時（透過 ts-patch TS plugin）TypeScript 會呼叫它，讓你能去改寫 AST。
 */
export function createTracingTransformer(
  program: ts.Program,
  userConfig?: Partial<TracingConfig>
): ts.TransformerFactory<ts.SourceFile> {
  
  // Load and validate configuration
  // ts-patch passes config directly, not nested in a config object
  const config = loadConfig(userConfig);
  
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      // Check if this file should be transformed
      if (!shouldTransformFile(sourceFile.fileName, config)) {
        return sourceFile;
      }
      
      // Create transform context
      const transformContext: TransformContext = {
        config,
        sourceFile: sourceFile.fileName,
        hasTracerImport: false,
        className: undefined
      };
      
      // Create visitor and transform the source file
      const visitor = createASTVisitor(context, transformContext);
      const result = ts.visitNode(sourceFile, visitor) as ts.SourceFile;
      
      return result;
    };
  };
}

// Export types and utilities for external use
export * from './types.js';
export * from './config-loader.js';

// Default export for ts-patch compatibility
export default createTracingTransformer;
