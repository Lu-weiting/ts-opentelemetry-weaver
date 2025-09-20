# Contributing to @waitingliou/ts-otel-weaver

Thank you for your interest in contributing to the TypeScript OpenTelemetry Weaver! This document provides guidelines for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project adheres to the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/master/code-of-conduct.md). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- TypeScript knowledge
- Basic understanding of OpenTelemetry concepts

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ts-opentelemetry-weaver.git
   cd ts-opentelemetry-weaver
   ```

2. **Install Dependencies**
   ```bash
   npm ci
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Run Tests with Coverage**
   ```bash
   npm run test:coverage
   ```

## 🔧 Contributing Guidelines

### Types of Contributions

We welcome the following types of contributions:

- **🐛 Bug Reports**: Report issues you encounter
- **✨ Feature Requests**: Suggest new features or improvements
- **📖 Documentation**: Improve documentation and examples
- **🔧 Code Contributions**: Fix bugs or implement features
- **🧪 Tests**: Add or improve test coverage

### Before You Start

1. **Check Existing Issues**: Look for existing issues or discussions
2. **Create an Issue**: For significant changes, create an issue first to discuss
3. **Follow OpenTelemetry Conventions**: Ensure your contribution aligns with OpenTelemetry standards

### Code Standards

#### TypeScript Guidelines
- Use TypeScript strict mode
- Provide proper type definitions
- Follow existing code style
- Use meaningful variable and function names

#### OpenTelemetry Compliance
- Follow [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
- Use standard span attributes and naming
- Ensure compatibility with OpenTelemetry API

#### Code Quality
- Maintain test coverage above 80%
- Run linter and fix warnings: `npm run lint`
- Format code: `npm run format`
- No console.log statements in production code

## 📥 Pull Request Process

### 1. Prepare Your Change

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run tests and ensure they pass
npm test

# Build and verify
npm run build
```

### 2. Commit Guidelines

We follow [Conventional Commits](https://conventionalcommits.org/):

```bash
# Format: type(scope): description
git commit -m "feat(transformer): add support for async method wrapping"
git commit -m "fix(config): resolve issue with include patterns"
git commit -m "docs(readme): update installation instructions"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or modifications
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 3. Submit Pull Request

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use the provided PR template
   - Link related issues
   - Describe your changes clearly
   - Add screenshots/examples if applicable

3. **Address Review Feedback**
   - Respond to review comments
   - Make requested changes
   - Update tests if needed

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ast-visitor.test.ts
```

### Test Requirements

- **Unit Tests**: All new functions must have unit tests
- **Integration Tests**: Complex features need integration tests
- **Coverage**: Maintain minimum 80% coverage
- **Test Naming**: Use descriptive test names

### Writing Tests

```typescript
describe('SpanInjector', () => {
  describe('createSpan', () => {
    it('should create span with correct attributes', () => {
      // Test implementation
    });
    
    it('should handle async methods correctly', () => {
      // Test implementation
    });
  });
});
```

## 📖 Documentation

### Documentation Requirements

- **README**: Keep examples up to date
- **API Documentation**: Document all public APIs
- **Configuration**: Document all configuration options
- **Examples**: Provide working examples
- **CHANGELOG**: Update for user-facing changes

### Documentation Style

- Use clear, concise language
- Provide code examples
- Include common use cases
- Keep examples up to date

## 🔍 Code Review Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New tests cover your changes
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly documented)
- [ ] Follows OpenTelemetry conventions
- [ ] TypeScript compilation succeeds
- [ ] No linting errors

## 🎯 OpenTelemetry Specific Guidelines

### Semantic Conventions

Follow [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/):

```typescript
// ✅ Correct
const span = tracer.startSpan('operation-name', {
  attributes: {
    'code.function': methodName,
    'code.namespace': className,
    'otel.library.name': packageName,
    'otel.library.version': packageVersion
  }
});

// ❌ Incorrect
const span = tracer.startSpan('operation-name', {
  attributes: {
    'service.method': methodName, // Non-standard
    'custom.attribute': value     // Should use standard conventions
  }
});
```

### Span Lifecycle

```typescript
// Proper span lifecycle management
const span = tracer.startSpan('operation');
try {
  // Operation logic
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  throw error;
} finally {
  span.end();
}
```

## 🤝 Community

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discord/Slack**: Join OpenTelemetry community channels

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for contributing to the TypeScript OpenTelemetry ecosystem! 🙏
