import * as ts from 'typescript';
import { TransformContext } from './types.js';
// Package information - these values are updated during build process
const PACKAGE_VERSION = '1.1.4';
const PACKAGE_NAME = '@waitingliou/ts-otel-weaver';

/**
 * Injects span wrapper around method body
 */
export function wrapMethodWithSpan(
  method: ts.MethodDeclaration,
  context: TransformContext
): ts.MethodDeclaration {
  const methodName = method.name?.getText() || 'unknown';
  const className = context.className || 'UnknownClass';
  const spanName = `${context.config.spanNamePrefix}.${className}.${methodName}`;
  
  // Check if method is async
  const isAsync = method.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword);
  
  // Check if method is a generator (has asterisk token)
  const isGenerator = !!method.asteriskToken;
  
  // Create the new method body based on method type
  let newBody: ts.Block;
  if (isGenerator && isAsync) {
    // Async generator function
    newBody = createAsyncGeneratorSpanWrapper(method, spanName, context);
  } else if (isGenerator) {
    // Sync generator function  
    newBody = createSyncGeneratorSpanWrapper(method, spanName, context);
  } else if (isAsync) {
    // Async function
    newBody = createAsyncSpanWrapper(method, spanName, context);
  } else {
    // Sync function
    newBody = createSyncSpanWrapper(method, spanName, context);
  }
  
  // Return new method with wrapped body
  return ts.factory.updateMethodDeclaration(
    method,
    method.modifiers,
    method.asteriskToken,
    method.name,
    method.questionToken,
    method.typeParameters,
    method.parameters,
    method.type,
    newBody
  );
}

/**
 * Creates async span wrapper for async methods
 */
function createAsyncSpanWrapper(
  method: ts.MethodDeclaration,
  spanName: string,
  context: TransformContext
): ts.Block {
  const originalBody = method.body;
  if (!originalBody) {
    return ts.factory.createBlock([]);
  }

  // Create attributes object
  const attributesObj = createAttributesObject(method, context);
  
  // Create the wrapper structure
  const wrapperStatements = [
    // return await tracer.startActiveSpan(spanName, async (span) => {
    ts.factory.createReturnStatement(
      ts.factory.createAwaitExpression(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('tracer'),
            ts.factory.createIdentifier('startActiveSpan')
          ),
          undefined,
          [
            ts.factory.createStringLiteral(spanName),
            attributesObj,
            ts.factory.createArrowFunction(
              [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
              undefined,
              [ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier('span'),
                undefined,
                undefined,
                undefined
              )],
              undefined,
              ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              createTryCatchBlock(originalBody, true)
            )
          ]
        )
      )
    )
  ];

  return ts.factory.createBlock(wrapperStatements, true);
}

/**
 * Creates sync span wrapper for synchronous methods
 */
function createSyncSpanWrapper(
  method: ts.MethodDeclaration,
  spanName: string,
  context: TransformContext
): ts.Block {
  const originalBody = method.body;
  if (!originalBody) {
    return ts.factory.createBlock([]);
  }

  // Create attributes object
  const attributesObj = createAttributesObject(method, context);
  
  // Create the wrapper structure
  const wrapperStatements = [
    // return tracer.startActiveSpan(spanName, (span) => {
    ts.factory.createReturnStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('tracer'),
          ts.factory.createIdentifier('startActiveSpan')
        ),
        undefined,
        [
          ts.factory.createStringLiteral(spanName),
          attributesObj,
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              ts.factory.createIdentifier('span'),
              undefined,
              undefined,
              undefined
            )],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            createTryCatchBlock(originalBody, false)
          )
        ]
      )
    )
  ];

  return ts.factory.createBlock(wrapperStatements, true);
}

/**
 * Creates try-catch block for error handling
 */
function createTryCatchBlock(originalBody: ts.Block, isAsync: boolean): ts.Block {
  const originalStatements = originalBody.statements;
  
  // Extract return statements from original body
  const bodyStatements: ts.Statement[] = [];
  let hasReturn = false;
  
  for (const stmt of originalStatements) {
    if (ts.isReturnStatement(stmt)) {
      hasReturn = true;
      // For return statements, we need to capture the value, set span status, and return
      if (stmt.expression) {
        // Add all previous non-return statements
        bodyStatements.push(createSpanSetStatusOk());
        
        bodyStatements.push(
          ts.factory.createReturnStatement(stmt.expression)
        );
      } else {
        bodyStatements.push(createSpanSetStatusOk());
        bodyStatements.push(stmt);
      }
    } else {
      bodyStatements.push(stmt);
    }
  }
  
  // If no explicit return, add span success status
  if (!hasReturn) {
    bodyStatements.push(createSpanSetStatusOk());
  }
  
  const tryBlock = ts.factory.createBlock(bodyStatements, true);
  
  const catchClause = ts.factory.createCatchClause(
    ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier('error'),
      undefined,
      undefined,
      undefined
    ),
    ts.factory.createBlock([
      // span.recordException(error);
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('span'),
            ts.factory.createIdentifier('recordException')
          ),
          undefined,
          [ts.factory.createIdentifier('error')]
        )
      ),
      // span.setStatus({ code: SpanStatusCode.ERROR });
      createSpanSetStatusError(),
      // throw error;
      ts.factory.createThrowStatement(ts.factory.createIdentifier('error'))
    ], true)
  );
  
  const finallyBlock = ts.factory.createBlock([
    // span.end();
    ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('span'),
          ts.factory.createIdentifier('end')
        ),
        undefined,
        []
      )
    )
  ], true);
  
  return ts.factory.createBlock([
    ts.factory.createTryStatement(
      tryBlock,
      catchClause,
      finallyBlock
    )
  ], true);
}

/**
 * Creates attributes object for span following OpenTelemetry semantic conventions
 */
function createAttributesObject(method: ts.MethodDeclaration, context: TransformContext): ts.ObjectLiteralExpression {
  const methodName = method.name?.getText() || 'unknown';
  const className = context.className || 'UnknownClass';
  
  const properties: ts.ObjectLiteralElementLike[] = [
    // kind: SpanKind.INTERNAL
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier('kind'),
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('SpanKind'),
        ts.factory.createIdentifier('INTERNAL')
      )
    ),
    // attributes: { ... }
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier('attributes'),
      ts.factory.createObjectLiteralExpression([
        // Standard OpenTelemetry semantic conventions
        ts.factory.createPropertyAssignment(
          ts.factory.createStringLiteral('code.function'),
          ts.factory.createStringLiteral(methodName)
        ),
        ts.factory.createPropertyAssignment(
          ts.factory.createStringLiteral('code.namespace'),
          ts.factory.createStringLiteral(className)
        ),
        // Instrumentation library information
        ts.factory.createPropertyAssignment(
          ts.factory.createStringLiteral('otel.library.name'),
          ts.factory.createStringLiteral(PACKAGE_NAME)
        ),
        ts.factory.createPropertyAssignment(
          ts.factory.createStringLiteral('otel.library.version'),
          ts.factory.createStringLiteral(PACKAGE_VERSION)
        ),
        // Add common attributes if configured
        ...(context.config.commonAttributes ? 
          Object.entries(context.config.commonAttributes).map(([key, value]) =>
            ts.factory.createPropertyAssignment(
              ts.factory.createStringLiteral(key),
              ts.factory.createStringLiteral(value)
            )
          ) : []
        )
      ], true)
    )
  ];
  
  return ts.factory.createObjectLiteralExpression(properties, true);
}

/**
 * Creates span.setStatus({ code: SpanStatusCode.OK }) statement
 */
function createSpanSetStatusOk(): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('span'),
        ts.factory.createIdentifier('setStatus')
      ),
      undefined,
      [ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier('code'),
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('SpanStatusCode'),
            ts.factory.createIdentifier('OK')
          )
        )
      ], false)]
    )
  );
}

/**
 * Creates span.setStatus({ code: SpanStatusCode.ERROR }) statement
 */
function createSpanSetStatusError(): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('span'),
        ts.factory.createIdentifier('setStatus')
      ),
      undefined,
      [ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier('code'),
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('SpanStatusCode'),
            ts.factory.createIdentifier('ERROR')
          )
        )
      ], false)]
    )
  );
}

/**
 * Creates async generator span wrapper for async generator methods
 */
function createAsyncGeneratorSpanWrapper(
  method: ts.MethodDeclaration,
  spanName: string,
  context: TransformContext
): ts.Block {
  const originalBody = method.body;
  if (!originalBody) {
    return ts.factory.createBlock([]);
  }

  // Create attributes object
  const attributesObj = createAttributesObject(method, context);

  // For async generators, we need to wrap but maintain the generator nature
  // const span = tracer.startSpan("spanName", {...});
  // try {
  //   for await (const item of originalMethod.call(this, ...args)) {
  //     yield item;
  //   }
  //   span.setStatus({ code: SpanStatusCode.OK });
  // } catch (error) {
  //   span.recordException(error);
  //   span.setStatus({ code: SpanStatusCode.ERROR });
  //   throw error;
  // } finally {
  //   span.end();
  // }

  const wrapperStatements = [
    // const span = tracer.startSpan("spanName", {...});
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList([
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier('span'),
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('tracer'),
              ts.factory.createIdentifier('startSpan')
            ),
            undefined,
            [
              ts.factory.createStringLiteral(spanName),
              attributesObj
            ]
          )
        )
      ], ts.NodeFlags.Const)
    ),
    
    // try-catch-finally block
    ts.factory.createTryStatement(
      ts.factory.createBlock([
        // Create an inner async generator function with the original body
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList([
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier('innerGenerator'),
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createFunctionExpression(
                    [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
                    ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
                    undefined,
                    undefined,
                    [],
                    undefined,
                    ts.factory.createBlock([...originalBody.statements], true)
                  ),
                  ts.factory.createIdentifier('call')
                ),
                undefined,
                [ts.factory.createThis()]
              )
            )
          ], ts.NodeFlags.Const)
        ),
        
        // for await (const item of innerGenerator) { yield item; }
        ts.factory.createForOfStatement(
          ts.factory.createToken(ts.SyntaxKind.AwaitKeyword),
          ts.factory.createVariableDeclarationList([
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier('item'),
              undefined,
              undefined,
              undefined
            )
          ], ts.NodeFlags.Const),
          ts.factory.createIdentifier('innerGenerator'),
          ts.factory.createBlock([
            ts.factory.createExpressionStatement(
              ts.factory.createYieldExpression(
                undefined,
                ts.factory.createIdentifier('item')
              )
            )
          ])
        ),
        
        // span.setStatus({ code: SpanStatusCode.OK });
        createSpanSetStatusOk()
      ], true),
      
      // catch clause
      ts.factory.createCatchClause(
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier('error'),
          undefined,
          undefined,
          undefined
        ),
        ts.factory.createBlock([
          // span.recordException(error);
          ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('span'),
                ts.factory.createIdentifier('recordException')
              ),
              undefined,
              [ts.factory.createIdentifier('error')]
            )
          ),
          // span.setStatus({ code: SpanStatusCode.ERROR });
          ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('span'),
                ts.factory.createIdentifier('setStatus')
              ),
              undefined,
              [
                ts.factory.createObjectLiteralExpression([
                  ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier('code'),
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier('SpanStatusCode'),
                      ts.factory.createIdentifier('ERROR')
                    )
                  )
                ])
              ]
            )
          ),
          // throw error;
          ts.factory.createThrowStatement(ts.factory.createIdentifier('error'))
        ])
      ),
      
      // finally clause
      ts.factory.createBlock([
        // span.end();
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('span'),
              ts.factory.createIdentifier('end')
            ),
            undefined,
            []
          )
        )
      ])
    )
  ];

  return ts.factory.createBlock(wrapperStatements, true);
}

/**
 * Creates sync generator span wrapper for sync generator methods
 */
function createSyncGeneratorSpanWrapper(
  method: ts.MethodDeclaration,
  spanName: string,
  context: TransformContext
): ts.Block {
  const originalBody = method.body;
  if (!originalBody) {
    return ts.factory.createBlock([]);
  }

  // Create attributes object
  const attributesObj = createAttributesObject(method, context);

  // Create the wrapper that yields from the original generator with span context
  const wrapperStatements = [
    // return tracer.startActiveSpan("spanName", {...}, function* (span) {
    ts.factory.createReturnStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('tracer'),
          ts.factory.createIdentifier('startActiveSpan')
        ),
        undefined,
        [
          ts.factory.createStringLiteral(spanName),
          attributesObj,
          // The generator function that wraps the original method body
          ts.factory.createFunctionExpression(
            undefined,
            ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
            undefined,
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier('span')
              )
            ],
            undefined,
            createSyncGeneratorTryCatchBlock([...originalBody.statements])
          )
        ]
      )
    )
  ];

  return ts.factory.createBlock(wrapperStatements, true);
}

/**
 * Creates try-catch block for async generator with span error handling
 */
function createAsyncGeneratorTryCatchBlock(originalStatements: ts.Statement[]): ts.Block {
  const tryStatements = [
    // yield* (original method body as async generator)
    ts.factory.createExpressionStatement(
      ts.factory.createYieldExpression(
        ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
        ts.factory.createCallExpression(
          ts.factory.createFunctionExpression(
            [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
            ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createBlock(originalStatements, true)
          ),
          undefined,
          []
        )
      )
    ),
    // span.setStatus({ code: SpanStatusCode.OK });
    createSpanSetStatusOk()
  ];

  const catchClause = ts.factory.createCatchClause(
    ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier('error'),
      undefined,
      undefined,
      undefined
    ),
    ts.factory.createBlock([
      // span.recordException(error);
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('span'),
            ts.factory.createIdentifier('recordException')
          ),
          undefined,
          [ts.factory.createIdentifier('error')]
        )
      ),
      // span.setStatus({ code: SpanStatusCode.ERROR });
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('span'),
            ts.factory.createIdentifier('setStatus')
          ),
          undefined,
          [
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier('code'),
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('SpanStatusCode'),
                  ts.factory.createIdentifier('ERROR')
                )
              )
            ])
          ]
        )
      ),
      // throw error;
      ts.factory.createThrowStatement(ts.factory.createIdentifier('error'))
    ])
  );

  return ts.factory.createBlock([
    ts.factory.createTryStatement(
      ts.factory.createBlock(tryStatements, true),
      catchClause,
      undefined
    )
  ], true);
}

/**
 * Creates try-catch block for sync generator with span error handling
 */
function createSyncGeneratorTryCatchBlock(originalStatements: ts.Statement[]): ts.Block {
  const tryStatements = [
    // yield* (original method body as generator)
    ts.factory.createExpressionStatement(
      ts.factory.createYieldExpression(
        ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
        ts.factory.createCallExpression(
          ts.factory.createFunctionExpression(
            undefined,
            ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createBlock(originalStatements, true)
          ),
          undefined,
          []
        )
      )
    ),
    // span.setStatus({ code: SpanStatusCode.OK });
    createSpanSetStatusOk()
  ];

  const catchClause = ts.factory.createCatchClause(
    ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier('error'),
      undefined,
      undefined,
      undefined
    ),
    ts.factory.createBlock([
      // span.recordException(error);
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('span'),
            ts.factory.createIdentifier('recordException')
          ),
          undefined,
          [ts.factory.createIdentifier('error')]
        )
      ),
      // span.setStatus({ code: SpanStatusCode.ERROR });
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('span'),
            ts.factory.createIdentifier('setStatus')
          ),
          undefined,
          [
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier('code'),
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('SpanStatusCode'),
                  ts.factory.createIdentifier('ERROR')
                )
              )
            ])
          ]
        )
      ),
      // throw error;
      ts.factory.createThrowStatement(ts.factory.createIdentifier('error'))
    ])
  );

  return ts.factory.createBlock([
    ts.factory.createTryStatement(
      ts.factory.createBlock(tryStatements, true),
      catchClause,
      undefined
    )
  ], true);
}
