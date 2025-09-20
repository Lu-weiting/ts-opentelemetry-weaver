# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CONTRIBUTING.md with comprehensive contribution guidelines
- CHANGELOG.md for tracking version changes
- OpenTelemetry semantic conventions compliance

### Changed
- Updated span attributes to follow OpenTelemetry semantic conventions
- Improved tracer naming to include package version
- Enhanced documentation with OpenTelemetry best practices

### Fixed
- Corrected span attribute naming to match official standards

## [1.1.0] - 2024-09-20

### Added
- Automatic TypeScript AST transformation for OpenTelemetry instrumentation
- Zero-touch business logic tracing capability
- Compile-time span injection for methods
- Configurable include/exclude patterns
- Support for private method instrumentation
- Automatic tracer import injection
- Comprehensive test coverage with Jest
- CI/CD pipeline with GitHub Actions

### Features
- **Zero-touch Instrumentation**: No code changes required in business logic
- **Deep Tracing**: Automatically traces all method calls, including private methods
- **Minimal Runtime Overhead**: Compile-time patching instead of runtime monkey-patching
- **TypeScript Transformer**: Integrates with TypeScript compiler through ts-patch
- **Configurable Options**: Flexible configuration for different use cases

### Supported Platforms
- Node.js >= 18.0.0
- TypeScript >= 4.5.0
- OpenTelemetry API >= 1.9.0

### Documentation
- Complete README with installation and usage instructions
- API documentation for all configuration options
- Example projects demonstrating usage
- Release preparation scripts and guidelines

### Testing
- Unit tests for all core functionality
- Integration tests for TypeScript transformer
- 80%+ test coverage requirement
- Automated testing in CI/CD

### Configuration Options
- `include`: File patterns to instrument
- `exclude`: File patterns to skip
- `instrumentPrivateMethods`: Toggle for private method instrumentation
- `spanNamePrefix`: Custom span name prefix
- `autoInjectTracer`: Automatic tracer import injection
- `commonAttributes`: Common attributes for all spans
- `excludeMethods`: Method names to exclude
- `includeMethods`: Specific methods to include
- `debug`: Debug mode for development
- `logLevel`: Configurable logging levels
- `maxMethodsPerFile`: Safety limit for methods per file

### Initial Release Features
- TypeScript AST visitor for method detection
- Span injection with proper error handling
- Configuration validation and loading
- ES modules support with proper exports
- Source map generation for debugging
- Comprehensive error handling and validation

## [1.0.0] - Initial Development

### Added
- Project initialization
- Basic TypeScript transformer structure
- Core AST manipulation logic
- Initial test framework setup

---

## Release Notes Format

Each release includes:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

## Migration Guides

For breaking changes, detailed migration guides will be provided in the release notes.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for information on how to contribute to this project.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.