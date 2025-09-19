# @waitingliou/ts-otel-weaver

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/Lu-weiting/ts-opentelemetry-weaver/actions/workflows/ci.yml/badge.svg)](https://github.com/Lu-weiting/ts-opentelemetry-weaver/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

An automatic instrumentation tool, complimentary to [OpenTelemetry](https://opentelemetry.io/) to enable tracing in your business logic without messing up your codebase.

## Specification
A TypeScript transformer that automatically instruments your business logic methods with OpenTelemetry spans at compile time through AST weaving, achieving true "application-level transparency" as described in Google's Dapper paper.
- **Zero-touch**: No code changes required in your business logic
- **Deep Tracing**: Automatically traces all method calls, including private methods
- **Minimal Runtime Overhead**: Instead of runtime monkey-patch -> comile-time patching

## Installation

```bash
npm install @waitingliou/ts-otel-weaver
```

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

`ts-patch` patches your local typescript installation so the official `tsc` can load custom transformers from `compilerOptions.plugins`.

```bash
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

Ensure your project has OpenTelemetry API:

```bash
npm install @opentelemetry/api
```



### 4. Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `include` | `string[]` | ✅ | - | File patterns to process (e.g., `["**/*Service.ts"]`) |
| `exclude` | `string[]` | ❌ | `[]` | File patterns to exclude (e.g., `["**/*.test.ts"]`) |
| `instrumentPrivateMethods` | `boolean` | ❌ | `false` | Whether to process private methods |
| `spanNamePrefix` | `string` | ❌ | `""` | Span name prefix for all generated spans |
| `autoInjectTracer` | `boolean` | ❌ | `true` | Whether to auto-inject tracer imports |
| `commonAttributes` | `Record<string, string>` | ❌ | `{}` | Common attributes added to all spans |
| `excludeMethods` | `string[]` | ❌ | `[]` | Method names to exclude from instrumentation |
| `includeMethods` | `string[]` | ❌ | `[]` | Only include these methods (highest priority) |
| `debug` | `boolean` | ❌ | `false` | Enable debug mode for transformation logs |
| `logLevel` | `'none' \| 'error' \| 'warn' \| 'info' \| 'debug'` | ❌ | `'warn'` | Logging level for transformer output |
| `maxMethodsPerFile` | `number` | ❌ | `100` | Safety limit for methods per file |


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
| [Honojs](python/instrumentation/openinference-instrumentation-agno/examples/) | test |


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

- Node.js >= 16.0.0
- TypeScript >= 4.5.0
- OpenTelemetry API >= 1.9.0

## 📄 License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by runtime monkey-patching of OpenTelemetry Instrumentation libraries
- Thanks to @Pathors. As the Pathors system has grown, the need for monitoring has also increased, and during the process of introducing OTel, I was inspired with the idea of developing this tool.
- Leverages TypeScript Compiler API for AST transformations

## 🔗 Related Projects

- [OpenTelemetry](https://opentelemetry.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [ts-patch](https://github.com/nonara/ts-patch)
