import * as ts from 'typescript';
import { TransformContext } from './types.js';
import { shouldInstrumentMethod, shouldTransformFile } from './config-loader.js';
import { wrapMethodWithSpan } from './span-injector.js';

/**
 * Creates AST visitor for transforming source files
 */
export function createASTVisitor(
  context: ts.TransformationContext,
  transformContext: TransformContext
): ts.Visitor {
  
  function visit(node: ts.Node): ts.Node {
    // Handle source file - inject imports if needed
    if (ts.isSourceFile(node)) {
      return visitSourceFile(node, transformContext, context);
    }
    
    // Handle class declarations
    if (ts.isClassDeclaration(node)) {
      return visitClassDeclaration(node, transformContext, context);
    }
    
    // Handle method declarations within classes(not support arrow function for now)
    if (ts.isMethodDeclaration(node)) {
      return visitMethodDeclaration(node, transformContext);
    }
    
    // Continue visiting child nodes
    return ts.visitEachChild(node, visit, context);
  }
  
  return visit;
}

/**
 * Visits source file and injects necessary imports
 */
function visitSourceFile(
  sourceFile: ts.SourceFile,
  transformContext: TransformContext,
  context: ts.TransformationContext
): ts.SourceFile {
  // Update transform context with source file
  transformContext.sourceFile = sourceFile.fileName;
  transformContext.hasTracerImport = hasExistingTracerImport(sourceFile);
  
  // Check if this file should be transformed
  if (!shouldTransformFile(sourceFile.fileName, transformContext.config)) {
    return sourceFile; // Return unchanged if not matching patterns
  }
  
  // First, visit all child nodes to transform methods
  const transformedStatements = sourceFile.statements.map(statement => 
    ts.visitNode(statement, createVisitor(context, transformContext)) as ts.Statement
  );
  
  // If auto-inject is enabled and no tracer import exists, inject it
  if (transformContext.config.autoInjectTracer && !transformContext.hasTracerImport) {
    const newStatements = [
      ...createTracerImports(),
      ...transformedStatements
    ];
    
    return ts.factory.updateSourceFile(
      sourceFile,
      newStatements,
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives
    );
  }
  
  return ts.factory.updateSourceFile(
    sourceFile,
    transformedStatements,
    sourceFile.isDeclarationFile,
    sourceFile.referencedFiles,
    sourceFile.typeReferenceDirectives,
    sourceFile.hasNoDefaultLib,
    sourceFile.libReferenceDirectives
  );
}

/**
 * Creates a visitor function for visiting child nodes
 */
function createVisitor(
  context: ts.TransformationContext,
  transformContext: TransformContext
): ts.Visitor {
  return function visitor(node: ts.Node): ts.Node {
    if (ts.isClassDeclaration(node)) {
      return visitClassDeclaration(node, transformContext, context);
    }
    return ts.visitEachChild(node, visitor, context);
  };
}

/**
 * Visits class declaration and updates transform context
 */
function visitClassDeclaration(
  classDecl: ts.ClassDeclaration,
  transformContext: TransformContext,
  context: ts.TransformationContext
): ts.ClassDeclaration {
  // Update transform context with class name
  const previousClassName = transformContext.className;
  transformContext.className = classDecl.name?.getText() || 'UnknownClass';
  
  // Create a visitor for class members
  const memberVisitor = (node: ts.Node): ts.Node => {
    if (ts.isMethodDeclaration(node)) {
      return visitMethodDeclaration(node, transformContext);
    }
    return node;
  };
  
  // Visit all members of the class
  const newMembers = classDecl.members.map(member => 
    ts.visitNode(member, memberVisitor) as ts.ClassElement
  );
  
  // Restore previous class name
  transformContext.className = previousClassName;
  
  return ts.factory.updateClassDeclaration(
    classDecl,
    classDecl.modifiers,
    classDecl.name,
    classDecl.typeParameters,
    classDecl.heritageClauses,
    newMembers
  );
}

/**
 * Visits method declaration and applies instrumentation if needed
 */
function visitMethodDeclaration(
  method: ts.MethodDeclaration,
  transformContext: TransformContext
): ts.MethodDeclaration {
  const methodName = method.name?.getText();
  
  // Skip if no method name
  if (!methodName) {
    return method;
  }
  
  // Skip if method should not be instrumented
  if (!shouldInstrumentMethod(methodName, transformContext.config)) {
    return method;
  }
  
  // Skip if method has no body (interface or abstract method)
  if (!method.body) {
    return method;
  }
  
  // Skip constructor methods
  if (ts.isConstructorDeclaration(method)) {
    return method;
  }
  
  // Apply span wrapping
  const wrappedMethod = wrapMethodWithSpan(method, transformContext);
  
  return wrappedMethod;
}

/**
 * Checks if the source file already has tracer imports
 */
function hasExistingTracerImport(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        // Check if importing from @opentelemetry/api
        if (moduleSpecifier.text === '@opentelemetry/api') {
          // Check if importing trace, SpanStatusCode, or SpanKind
          const importClause = statement.importClause;
          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            const imports = importClause.namedBindings.elements.map(el => el.name.text);
            if (imports.includes('trace') || imports.includes('SpanStatusCode') || imports.includes('SpanKind')) {
              return true;
            }
          }
        }
      }
    }
    
    // Check for existing tracer variable declarations
    if (ts.isVariableStatement(statement)) {
      const declarations = statement.declarationList.declarations;
      for (const decl of declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === 'tracer') {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Creates necessary import statements for tracing
 */
function createTracerImports(): ts.Statement[] {
  const imports: ts.Statement[] = [];
  
  // Import OpenTelemetry types and functions
  // import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
  imports.push(
    ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        undefined, // phaseModifier (replaces isTypeOnly boolean)
        undefined, // name
        ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('trace')),
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('SpanStatusCode')),
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('SpanKind'))
        ])
      ),
      ts.factory.createStringLiteral('@opentelemetry/api')
    )
  );
  
  // Create tracer instance
  // const tracer = trace.getTracer('@waiting/ts-otel-weaver');
  imports.push(
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier('tracer'),
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('trace'),
              ts.factory.createIdentifier('getTracer')
            ),
            undefined,
            [ts.factory.createStringLiteral('@waiting/ts-otel-weaver')]
          )
        )],
        ts.NodeFlags.Const
      )
    )
  );
  
  return imports;
}
