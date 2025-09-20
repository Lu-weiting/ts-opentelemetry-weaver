# @waitingliou/ts-otel-weaver

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/Lu-weiting/ts-opentelemetry-weaver/actions/workflows/ci.yml/badge.svg)](https://github.com/Lu-weiting/ts-opentelemetry-weaver/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Compatible-brightgreen.svg)](https://opentelemetry.io/)
[![npm version](https://badge.fury.io/js/%40waitingliou%2Fts-otel-weaver.svg)](https://www.npmjs.com/package/@waitingliou/ts-otel-weaver)

An automatic instrumentation tool, complimentary to [OpenTelemetry](https://opentelemetry.io/) to enable tracing in your business logic without messing up your codebase.


## Specification
A TypeScript transformer that automatically instruments your business logic methods with OpenTelemetry spans at compile time through AST weaving, achieving true "application-level transparency" as described in Google's Dapper paper.
- **Zero-touch**: No code changes required in your business logic
- **Deep Tracing**: Automatically traces all method calls, including private methods
- **Minimal Runtime Overhead**: Instead of runtime monkey-patch -> comile-time patching

> **OpenTelemetry Compatible**: This package follows [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) and integrates seamlessly with the OpenTelemetry ecosystem.

## Installation

```bash
# Install as development dependency (compile-time only)
npm install @waitingliou/ts-otel-weaver --save-dev
```

> [!IMPORTANT]
> This package is a compile-time TypeScript transformer that modifies your code during the build process. The generated JavaScript code has no runtime dependency on this package - only on `@opentelemetry/api`.

## Usage:

### 1. Configure TypeScript Compiler

Add the transformer to your project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@waitingliou/ts-otel-weaver/transformer",
        "include": [
          "**/*Service.ts",
          "**/*Repository.ts"
        ],
        "exclude": [
          "**/*.test.ts",
          "**/*.spec.ts"
        ],
        "instrumentPrivateMethods": true,
        "spanNamePrefix": "myapp",
        "autoInjectTracer": true
      }
    ]
  }
}
```

### 2. Install and Configure ts-patch

`ts-patch` patches your local TypeScript installation so the official `tsc` can load custom transformers from `compilerOptions.plugins`.

```bash
# Install ts-patch as development dependency  
npm install ts-patch --save-dev
npx ts-patch install -s
```

I recommend adding a postinstall step to your npm scripts to ensure teammates automatically set up ts-patch after installing dependencies:
```json
"scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "postinstall": "ts-patch install -s"
},
```

### 3. Add OpenTelemetry Dependencies

Install OpenTelemetry API as a production dependency (required at runtime):

```bash
# Runtime dependency for generated instrumentation code
npm install @opentelemetry/api
```



### 4. Configuration Options

#### Complete tsconfig.json Compile Plugin Configuration Example

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@waitingliou/ts-otel-weaver/transformer",
        "include": [
          "**/*Service.ts",
          "**/*Repository.ts",
          "src/business/**/*.ts"
        ],
        "exclude": [
          "**/*.test.ts",
          "**/*.spec.ts",
          "**/node_modules/**"
        ],
        "instrumentPrivateMethods": true,
        "spanNamePrefix": "myapp",
        "autoInjectTracer": true,
        "commonAttributes": {
          "service.name": "user-management-service",
          "service.version": "1.2.0",
          "deployment.environment": "production"
        },
        "includeMethods": ["createUser", "updateUser", "deleteUser"],
        "excludeMethods": ["toString", "valueOf", "deprecated"],
        "debug": false,
        "logLevel": "warn",
        "maxMethodsPerFile": 50
      }
    ]
  }
}
```

#### Configuration Options Reference

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `include` | `string[]` | ✅ | - | **Glob patterns** for files to instrument. Supports standard glob syntax: `**/*Service.ts`, `src/business/**/*.ts` |
| `exclude` | `string[]` | ❌ | `["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]` | **Glob patterns** for files to skip. Takes priority over `include` |
| `instrumentPrivateMethods` | `boolean` | ❌ | `false` | Include methods starting with `_` (underscore). Example: `_privateMethod` |
| `spanNamePrefix` | `string` | ❌ | `"ts-otel-weaver"` | Prefix for all span names. Final span: `{prefix}.{ClassName}.{methodName}` |
| `autoInjectTracer` | `boolean` | ❌ | `true` | Automatically add `import { trace } from "@opentelemetry/api"` to instrumented files |
| `commonAttributes` | `Record<string, string>` | ❌ | `{}` | **Key-value pairs** added to ALL spans. Use for service metadata, environment info, etc. |
| `includeMethods` | `string[]` | ❌ | `[]` | **EXACT method names** to instrument. **Highest priority** - only these methods will be instrumented if specified |
| `excludeMethods` | `string[]` | ❌ | `["constructor", "toString", "valueOf", "toJSON", "inspect"]` | **EXACT method names** to skip. Ignored if `includeMethods` is set |
| `debug` | `boolean` | ❌ | `false` | Enable detailed transformation logs during compilation |
| `logLevel` | `'none' \| 'error' \| 'warn' \| 'info' \| 'debug'` | ❌ | `'warn'` | Control console output verbosity |
| `maxMethodsPerFile` | `number` | ❌ | `100` | Safety limit to prevent accidentally instrumenting too many methods |

## Auto-generated spans structure examples

When you call a method, it automatically generates a tracing structure like:

```
myapp.UserService.getUser
├── myapp.UserService._fetchUserData
│   ├── myapp.DatabaseService.query
│   └── myapp.CacheService.get
├── myapp.UserService._processUserData
│   ├── myapp.ValidationService.validate
│   └── myapp.TransformService.transform
└── myapp.NotificationService.sendWelcome
```

### Examples
| Name | Description |
|--------|------|
| [Honojs](python/instrumentation/openinference-instrumentation-agno/examples/) | not done yet |


## Debugging and Verification

Compile and check:

```bash
npm run build

# check import
head -5 dist/your-service.js
# should see：
# import { trace, SpanStatusCode, SpanKind } from "@opentelemetry/api";
# const tracer = trace.getTracer("@waitingliou/ts-otel-weaver");
```

## 📋 Requirements

### Development Dependencies
- Node.js >= 18.0.0
- TypeScript >= 4.5.0  
- ts-patch for transformer integration

### Runtime Dependencies
- @opentelemetry/api >= 1.9.0 (for generated instrumentation code)

## 📄 License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by runtime monkey-patching of OpenTelemetry Instrumentation libraries
- Thanks to [@Pathors](https://pathors.com/). As a intern in @Pathors, I was inspired with the idea of developing this tool during the process of integrating OTel.
- Leverages TypeScript Compiler API for AST transformations

## 🔗 Related Projects

- [OpenTelemetry](https://opentelemetry.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [ts-patch](https://github.com/nonara/ts-patch)
