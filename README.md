# @waiting/ts-otel-weaver

**Opentelemetry automatic and zero-touch business-logic instrumentation for TypeScript via compile-time AST weaving**

A TypeScript transformer that automatically instruments your business logic methods with OpenTelemetry spans at compile time, achieving true "application-level transparency" as described in Google's Dapper paper.

[![npm version](https://badge.fury.io/js/%40waiting%2Fts-otel-weaver.svg)](https://badge.fury.io/js/%40waiting%2Fts-otel-weaver)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 🚀 Features

- **🔧 Compile-time Instrumentation**: Uses TypeScript Transformer to automatically inject OpenTelemetry spans during compilation
- **🎯 Zero-touch**: No code changes required in your business logic
- **📊 Deep Tracing**: Automatically traces all method calls, including private methods
- **⚡ Zero Runtime Overhead**: Compile-time transformation means no performance penalty
- **🎨 Clean Architecture**: Pure compile-time approach with no runtime dependencies

## Installation

```bash
npm install @waiting/ts-otel-weaver
```

## 🎯 Usage: Compile-time Instrumentation

### 1. Configure TypeScript Compiler

Add the transformer to your project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@waiting/ts-otel-weaver/transformer",
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

ts-patch 是必要的，因為 TypeScript 編譯器預設不支援第三方 transformer。ts-patch 會修補您本機的 TypeScript 安裝，使其能夠載入我們的 transformer。

```bash
npm install ts-patch --save-dev
npx ts-patch install -s
```

建議在 npm scripts 中添加 postinstall 步驟，確保團隊成員安裝依賴後自動設定 ts-patch：
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

### 4. Usage

No code changes required! Your services will be automatically instrumented during compilation:

```typescript
// Original code
export class UserService {
  async getUser(id: string) {
    const userData = await this._fetchUserData(id);
    const processedData = await this._processUserData(userData);
    return processedData;
  }
  
  private async _fetchUserData(id: string) {
    // Implementation
  }

  private async _processUserData(data: any) {
    // Implementation  
  }
}

// Usage - completely unchanged!
export const userService = new UserService();

// Compiled output automatically includes complete span wrapping!
```

### 5. Configuration Options

```typescript
interface TracingConfig {
  include: string[];                    // File patterns to process
  exclude: string[];                    // File patterns to exclude
  instrumentPrivateMethods: boolean;    // Whether to process private methods
  spanNamePrefix: string;               // Span name prefix
  autoInjectTracer: boolean;            // Whether to auto-inject tracer imports
  commonAttributes?: Record<string, string>; // Common attributes
  excludeMethods?: string[];            // Method names to exclude
  includeMethods?: string[];            // Only include these methods (highest priority)
  debug?: boolean;                      // Enable debug mode
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  maxMethodsPerFile?: number;           // Safety limit for methods per file
}
```


## 📊 Auto-generated Spans and Attributes

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

### Span Attributes

Each span includes the following attributes:

- `code.function`: Method name
- `code.namespace`: Class name
- `service.name`: Service name
- `service.method`: Method name
- Complete error tracking and status management

## 🔧 Architecture Advantages

### Compile-time Transformation Benefits

- **🚀 Zero Runtime Overhead**: All instrumentation happens during compilation
- **📊 Complete Coverage**: Traces all method calls, including private methods
- **🎯 Deep Instrumentation**: Captures nested method calls automatically
- **🛡️ Type Safety**: Fully preserves TypeScript types and interfaces
- **🔄 Automatic Context Propagation**: Maintains trace context across all calls

## 📝 Best Practices

1. **File Patterns**: Use specific patterns in `include` to target only business logic files
2. **Method Filtering**: Use `excludeMethods` to skip utility methods like `toString`
3. **Debug Mode**: Enable `debug: true` during development to see transformation logs
4. **Performance**: The transformer adds zero runtime overhead - all instrumentation is compile-time

## 🔍 Debugging and Verification

### 驗證 Transformer 是否正確載入

首先確認 transformer 路徑可以正確解析：

```bash
# 檢查 transformer 路徑是否正確
node -e "console.log(require.resolve('@waiting/ts-otel-weaver/transformer'))"
# 應該輸出：node_modules/@waiting/ts-otel-weaver/dist/transformer/index.js
```

### 驗證轉換是否成功

編譯並檢查生成的 JavaScript：

```bash
# 編譯專案
npm run build

# 檢查自動注入的 import
head -5 dist/your-service.js
# 應該看到：
# import { trace, SpanStatusCode, SpanKind } from "@opentelemetry/api";
# const tracer = trace.getTracer("@waiting/ts-otel-weaver");
```

## 📋 Requirements

- Node.js >= 16.0.0
- TypeScript >= 4.5.0
- OpenTelemetry API >= 1.9.0

## 🧪 Testing

```bash
npm test                # Run tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Watch mode
```

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Google's Dapper paper on distributed tracing
- Built on OpenTelemetry specifications
- Leverages TypeScript Compiler API for AST transformations

## 🔗 Related Projects

- [OpenTelemetry](https://opentelemetry.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [ts-patch](https://github.com/nonara/ts-patch)
