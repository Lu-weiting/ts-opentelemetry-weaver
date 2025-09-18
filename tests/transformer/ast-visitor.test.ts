import * as ts from 'typescript';
import { createASTVisitor } from '../../src/transformer/ast-visitor.js';
import { TransformContext, DEFAULT_CONFIG } from '../../src/transformer/types.js';

describe('AST Visitor', () => {
  function createTransformContext(overrides: Partial<TransformContext> = {}): TransformContext {
    return {
      config: DEFAULT_CONFIG,
      sourceFile: 'test.ts',
      hasTracerImport: false,
      className: undefined,
      ...overrides,
    };
  }

  function compileSource(sourceCode: string, context: TransformContext, fileName: string = 'test.ts'): string {
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.ES2022,
      true
    );

    const transformationContext: ts.TransformationContext = {
      factory: ts.factory,
      getCompilerOptions: () => ({}),
      startLexicalEnvironment: () => {},
      suspendLexicalEnvironment: () => {},
      resumeLexicalEnvironment: () => {},
      endLexicalEnvironment: () => [],
      hoistFunctionDeclaration: () => {},
      hoistVariableDeclaration: () => {},
      requestEmitHelper: () => {},
      readEmitHelpers: () => [],
      enableSubstitution: () => {},
      isSubstitutionEnabled: () => false,
      onSubstituteNode: (_, node) => node,
      enableEmitNotification: () => {},
      isEmitNotificationEnabled: () => false,
      onEmitNode: () => {},
    };

    const visitor = createASTVisitor(transformationContext, context);
    const transformedSourceFile = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

    const printer = ts.createPrinter();
    return printer.printFile(transformedSourceFile);
  }

  it('should transform a simple class method', () => {
    const sourceCode = `
class TestService {
  getData(): string {
    return "hello";
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
        autoInjectTracer: true,
      },
    });

    const result = compileSource(sourceCode, context);
    
    // Should inject tracer imports
    expect(result).toContain('import { trace, SpanStatusCode, SpanKind }');
    expect(result).toContain('const tracer = trace.getTracer');
    
    // Should wrap the method with span
    expect(result).toContain('tracer.startActiveSpan');
    expect(result).toContain('ts-otel-weaver.TestService.getData');
  });

  it('should respect instrumentPrivateMethods setting', () => {
    const sourceCode = `
class TestService {
  private _privateMethod(): string {
    return "private";
  }
}`;

    const contextWithPrivate = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
        instrumentPrivateMethods: true,
      },
    });

    const contextWithoutPrivate = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
        instrumentPrivateMethods: false,
      },
    });

    const resultWith = compileSource(sourceCode, contextWithPrivate);
    const resultWithout = compileSource(sourceCode, contextWithoutPrivate);

    // With private methods enabled, should instrument
    expect(resultWith).toContain('tracer.startActiveSpan');
    
    // Without private methods, should not instrument
    expect(resultWithout).not.toContain('tracer.startActiveSpan');
  });

  it('should handle async methods correctly', () => {
    const sourceCode = `
class TestService {
  async getData(): Promise<string> {
    return "async hello";
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
      },
    });

    const result = compileSource(sourceCode, context);
    
    // Should use await for async methods
    expect(result).toContain('await tracer.startActiveSpan');
  });

  it('should handle methods with parameters', () => {
    const sourceCode = `
class TestService {
  processData(id: string, options: { debug: boolean }): string {
    return \`processed-\${id}\`;
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
      },
    });

    const result = compileSource(sourceCode, context);
    
    // Should preserve method parameters (TypeScript may format differently)
    expect(result).toContain('processData(id: string, options: {');
    expect(result).toContain('debug: boolean');
    expect(result).toContain('tracer.startActiveSpan');
  });

  it('should respect excludeMethods configuration', () => {
    const sourceCode = `
class TestService {
  getData(): string {
    return "data";
  }
  
  toString(): string {
    return "TestService";
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
        excludeMethods: ['toString'],
      },
    });

    const result = compileSource(sourceCode, context);
    
    // getData should be instrumented
    expect(result).toContain('ts-otel-weaver.TestService.getData');
    
    // toString should not be instrumented (should appear only once in span name)
    const toStringMatches = (result.match(/toString/g) || []).length;
    expect(toStringMatches).toBeLessThan(3); // Should not be wrapped in multiple spans
  });

  it('should handle multiple classes in one file', () => {
    const sourceCode = `
class UserService {
  getUser(): string {
    return "user";
  }
}

class OrderService {
  getOrder(): string {
    return "order";
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
      },
    });

    const result = compileSource(sourceCode, context);
    
    // Both classes should be instrumented
    expect(result).toContain('ts-otel-weaver.UserService.getUser');
    expect(result).toContain('ts-otel-weaver.OrderService.getOrder');
  });

  it('should add custom attributes from config', () => {
    const sourceCode = `
class TestService {
  getData(): string {
    return "data";
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*.ts'],
        commonAttributes: {
          'app.name': 'test-app',
          'app.version': '1.0.0',
        },
      },
    });

    const result = compileSource(sourceCode, context);
    
    // Should include custom attributes
    expect(result).toContain('"app.name": "test-app"');
    expect(result).toContain('"app.version": "1.0.0"');
  });

  it('should not transform files that do not match include patterns', () => {
    const sourceCode = `
class TestController {
  handleRequest(): string {
    return "handled";
  }
}`;

    const context = createTransformContext({
      config: {
        ...DEFAULT_CONFIG,
        include: ['**/*Service.ts'], // Only services, not controllers
      },
    });

    const result = compileSource(sourceCode, context, 'TestController.ts');
    
    // Should not be instrumented since it doesn't match the include pattern
    expect(result).not.toContain('tracer.startActiveSpan');
    expect(result).toContain('handleRequest()'); // Original method should remain
  });
});
