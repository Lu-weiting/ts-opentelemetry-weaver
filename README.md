# @pathors/otel-instrumentation

OpenTelemetry instrumentation for Pathors services featuring **automatic compile-time instrumentation** via TypeScript Transformer and runtime Proxy-based tracing.

A compile-time auto-instrumentation plugin for TypeScript that transparently weaves spans into selected classes/functions.

Zero-touch business-logic tracing for TypeScript via compile-time AST weaving

## 🚀 特色功能

- **🔧 編譯時自動 Instrumentation**: 使用 TypeScript Transformer 在編譯時自動為所有方法注入 OpenTelemetry spans
- **🎯 零侵入性**: 完全不需要修改業務邏輯程式碼
- **📊 深度追蹤**: 自動追蹤所有層級的方法調用，包括私有方法
- **⚡ 零運行時開銷**: 編譯時轉換，沒有 Proxy 性能損失
- **🔄 向後相容**: 支援傳統 Proxy 方式作為備用選項

## 安裝

```bash
npm install @pathors/otel-instrumentation
```

## 🎯 推薦使用方式：編譯時 Instrumentation

### 1. 配置 TypeScript 編譯器

在目標專案的 `tsconfig.json` 中添加 transformer：

```json
{
  "compilerOptions": {
    // 其他配置...
    "plugins": [
      {
        "transform": "@pathors/otel-instrumentation/dist/transformer/index.js",
        "include": [
          "**/*Service.ts",
          "**/*Repository.ts",
          "**/*Manager.ts"
        ],
        "exclude": [
          "**/*.test.ts",
          "**/*.spec.ts"
        ],
        "instrumentPrivateMethods": true,
        "spanNamePrefix": "pathors",
        "autoInjectTracer": true
      }
    ]
  }
}
```

### 2. 安裝 ts-patch

```bash
npm install ts-patch --save-dev
npx ts-patch install -s
```

### 3. 添加 OpenTelemetry 依賴

確保專案有 OpenTelemetry API：

```bash
npm install @opentelemetry/api
```

### 4. 使用方式

完全不需要修改程式碼！服務會在編譯時自動被 instrumented：

```typescript
// 原始程式碼
export class PathwayExecutionService {
  async completion(params) {
    const session = await this._resolveSession(params);
    const result = await this._executeEngine(session);
    return result;
  }
  
  private async _resolveSession(params) {
    // 實際邏輯
  }
}

// 使用時完全不需要包裝
export const pathwayExecutionService = new PathwayExecutionService({...});

// 編譯後自動生成完整的 span 包裝！
```

### 5. 編譯時配置選項

```typescript
interface TracingConfig {
  include: string[];                    // 要處理的檔案模式
  exclude: string[];                    // 要排除的檔案模式
  instrumentPrivateMethods: boolean;    // 是否處理私有方法
  spanNamePrefix: string;               // Span 名稱前綴
  autoInjectTracer: boolean;            // 是否自動注入 tracer imports
  commonAttributes?: Record<string, string>; // 共同屬性
  excludeMethods?: string[];            // 排除的方法名稱
  includeMethods?: string[];            // 僅包含的方法名稱（優先級最高）
}
```

## 🔄 傳統使用方式：Runtime Proxy

適用於無法使用 TypeScript Transformer 的場景：

```typescript
import { traceService } from '@pathors/otel-instrumentation';

// 包裝服務實例，自動追蹤所有方法
export const modelService = traceService(
  new ModelService(modelRepository),
  { 
    serviceName: 'ModelService',
    recordArguments: false // 避免記錄敏感資料
  }
);
```

### Runtime 配置選項

```typescript
interface ServiceTracingConfig {
  serviceName: string;                    // 服務名稱（必填）
  tracerName?: string;                    // 自訂 tracer 名稱
  commonAttributes?: Record<string, any>; // 共通 span 屬性
  recordArguments?: boolean;              // 是否記錄方法參數
  recordReturnValue?: boolean;            // 是否記錄回傳值
  spanKind?: SpanKind;                    // Span 類型
  includeMethods?: (method: string) => boolean; // 方法白名單
  excludeMethods?: (method: string) => boolean; // 方法黑名單
  methodAttributes?: (method: string, args: any[]) => Record<string, any>; // 方法特定屬性
}
```

## 📊 自動產生的 Spans 和屬性

當您調用一個方法時，會自動生成類似以下的追蹤結構：

```
pathors.PathwayExecutionService.completion
├── pathors.PathwayExecutionService._resolveSession
│   ├── pathors.SessionManager.getSession
│   └── pathors.PathwayExecutionService._prepareSession
│       ├── pathors.PathwayRepository.get
│       └── pathors.SessionHistoryService.createSessionHistory
├── pathors.PathwayExecutionService._executeEngine
│   ├── pathors.PathwayExecutionService._preloadResources
│   │   ├── pathors.ModelService.getModel
│   │   └── pathors.ToolService.getTool
│   └── pathors.PathwayEngine.execute
└── pathors.PathwayExecutionService._processNewMessages
```

### Span 屬性

每個 span 包含以下屬性：

- `code.function`: 方法名稱
- `code.namespace`: 類別名稱
- `pathors.service.name`: 服務名稱
- `pathors.service.method`: 方法名稱
- 完整的錯誤追蹤和狀態管理

## 🔧 架構優勢

### 編譯時 vs 運行時比較

| 特性 | 編譯時 Transformer | 運行時 Proxy |
|------|-------------------|---------------|
| 性能影響 | 零運行時開銷 | 輕微 Proxy 開銷 |
| 追蹤深度 | 完整（所有層級） | 僅第一層 |
| 私有方法 | ✅ 支援 | ❌ 不支援內部調用 |
| 設置複雜度 | 需要 ts-patch | 簡單包裝 |
| 類型安全 | ✅ 完整保持 | ✅ 完整保持 |

## 📝 使用建議

1. **新專案**：推薦使用編譯時 Transformer
2. **現有專案**：可先使用 Runtime Proxy，再逐步遷移
3. **混合使用**：兩種方式可以同時使用，Transformer 優先
4. **效能敏感**：必須使用編譯時 Transformer

## 🔍 除錯和驗證

檢查轉換是否成功：

```bash
# 編譯並檢查生成的 JavaScript
npm run build

# 檢查是否有自動注入的 imports
head -5 dist/your-service.js
# 應該看到：
# import { trace, SpanStatusCode, SpanKind } from "@opentelemetry/api";
# const tracer = trace.getTracer("@pathors/core");
```

## 注意事項

- **編譯時**：確保正確配置 ts-patch 和 transformer
- **檔案匹配**：檢查 include/exclude 模式是否正確
- **OpenTelemetry 設置**：確保有正確的 tracer provider 配置
- **敏感資料**：預設不記錄方法參數，避免敏感資料洩露

## 授權

MIT License