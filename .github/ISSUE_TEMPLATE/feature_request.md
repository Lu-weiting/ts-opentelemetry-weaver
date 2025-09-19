---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

## 🚀 Feature Request

### 📋 Summary

A clear and concise description of the feature you'd like to see.

### 🎯 Motivation

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the use case this feature would enable:**
- What specific tracing scenario would this support?
- How would it improve developer experience?
- What OpenTelemetry use cases would benefit?

### 💡 Proposed Solution

**Describe the solution you'd like:**
A clear and concise description of what you want to happen.

**Configuration example:**
If applicable, show how this feature might be configured:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@waitingliou/ts-otel-weaver/transformer",
        "newFeature": true,
        "newFeatureOptions": {
          // Your proposed configuration
        }
      }
    ]
  }
}
```

**Code example:**
Show how this feature would work in practice:

```typescript
// Before (current behavior)
export class UserService {
  async getUser(id: string) {
    // Current behavior
  }
}

// After (with new feature)
export class UserService {
  async getUser(id: string) {
    // How it would work with the new feature
  }
}
```

### 🔄 Alternatives Considered

**Describe alternatives you've considered:**
A clear and concise description of any alternative solutions or features you've considered.

### 📊 Impact Assessment

**Breaking changes:**
- [ ] This is a breaking change
- [ ] This requires documentation updates
- [ ] This affects existing configurations

**Complexity:**
- [ ] Simple (configuration option)
- [ ] Medium (new transformation logic)
- [ ] Complex (major architectural change)

### 🎨 Implementation Ideas

If you have ideas about how this could be implemented:

- Technical approach
- Files that might need changes
- Potential challenges
- Testing considerations

### 📚 Related

- Link to related issues
- Reference to OpenTelemetry specifications
- Links to similar features in other tools

### ✅ Acceptance Criteria

What would make this feature complete?

- [ ] Feature implemented
- [ ] Tests added
- [ ] Documentation updated
- [ ] Configuration options added
- [ ] Examples provided

### 🌟 Additional Context

Add any other context, screenshots, or examples about the feature request here.
