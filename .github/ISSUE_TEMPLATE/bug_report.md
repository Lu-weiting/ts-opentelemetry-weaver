---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 To Reproduce

Steps to reproduce the behavior:

1. Install package: `npm install @waitingliou/ts-otel-weaver`
2. Configure in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "plugins": [
         {
           "transform": "@waitingliou/ts-otel-weaver/transformer",
           "include": ["**/*Service.ts"]
         }
       ]
     }
   }
   ```
3. Run build command: `tsc`
4. See error

## ✅ Expected Behavior

A clear and concise description of what you expected to happen.

## ❌ Actual Behavior

A clear and concise description of what actually happened.

## 🖥️ Environment

- **OS**: [e.g. macOS 14.0, Windows 11, Ubuntu 22.04]
- **Node.js version**: [e.g. 20.9.0]
- **TypeScript version**: [e.g. 5.2.2]
- **Package version**: [e.g. 1.0.0]
- **ts-patch version**: [e.g. 3.0.2]

## 📋 Configuration

Please share your `tsconfig.json` transformer configuration:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@waitingliou/ts-otel-weaver/transformer",
        // Your configuration here
      }
    ]
  }
}
```

## 📝 Additional Context

- Error messages or logs
- Screenshots (if applicable)
- Related issues or discussions
- Any workarounds you've tried

## 📁 Sample Code

If possible, provide a minimal reproducible example:

```typescript
// Your TypeScript code that demonstrates the issue
export class UserService {
  async getUser(id: string) {
    // Your implementation
  }
}
```

## 🔍 Debug Information

If you have debug logs enabled (`"debug": true`), please share relevant output:

```
[ts-otel-weaver:debug] ...
```
