# Basic Usage Example

This example demonstrates how to use `@waiting/ts-otel-weaver` for automatic compile-time instrumentation of your TypeScript business logic.

## Features Demonstrated

- ✅ Zero-touch instrumentation of service classes
- ✅ Automatic tracing of private methods
- ✅ Error handling and exception recording
- ✅ Nested method call tracing
- ✅ Integration with OpenTelemetry ecosystem

## Prerequisites

1. **Node.js** >= 16.0.0
2. **Jaeger** for viewing traces (optional but recommended)

### Starting Jaeger (Docker)

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

Visit http://localhost:16686 to access Jaeger UI.

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install ts-patch to enable TypeScript transformers:**
   ```bash
   npx ts-patch install -s
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Run the example:**
   ```bash
   npm start
   ```

## What You'll See

### In the Console

The application will create users, send emails, and perform database operations. You'll see normal application logs - **no tracing code is visible in your business logic!**

### In Jaeger UI

Navigate to http://localhost:16686 and:

1. Select service: `ts-otel-weaver-example`
2. Click "Find Traces"
3. Click on any trace to see the detailed span hierarchy

You should see spans like:

```
example-app.UserService.createUser
├── example-app.UserService._validateUserData
│   ├── example-app.UserRepository.findByEmail
│   │   └── example-app.UserRepository._simulateDbQuery
│   └── example-app.UserService._isValidEmail
├── example-app.UserService._generateUserId
├── example-app.UserRepository.save
│   ├── example-app.UserRepository._validateUser
│   └── example-app.UserRepository._persistUser
│       └── example-app.UserRepository._simulateDbQuery
└── example-app.UserService._sendWelcomeEmail
    └── example-app.EmailService.sendWelcomeEmail
        ├── example-app.EmailService._generateWelcomeContent
        │   └── example-app.EmailService._delay
        └── example-app.EmailService._sendEmail
            └── example-app.EmailService._delay
```

## Key Files

- **`tsconfig.json`** - Shows transformer configuration
- **`src/services/UserService.ts`** - Business logic with NO tracing code
- **`src/repositories/UserRepository.ts`** - Data layer with NO tracing code
- **`src/services/EmailService.ts`** - Another service with NO tracing code
- **`src/tracing.ts`** - OpenTelemetry setup (standard OTel code)
- **`src/index.ts`** - Example application flow

## The Magic ✨

Notice that:

1. **No manual span creation** in business logic files
2. **No OpenTelemetry imports** in service classes
3. **Automatic instrumentation** of both public and private methods
4. **Automatic error tracking** when exceptions occur
5. **Complete trace context propagation** across method calls

All instrumentation happens at **compile-time** through the TypeScript transformer!

## Configuration

The transformer is configured in `tsconfig.json`:

```json
{
  "plugins": [
    {
      "transform": "@waiting/ts-otel-weaver/dist/transformer/index.js",
      "include": ["**/*Service.ts", "**/*Repository.ts"],
      "instrumentPrivateMethods": true,
      "spanNamePrefix": "example-app",
      "autoInjectTracer": true,
      "debug": true
    }
  ]
}
```

## Next Steps

1. **Explore the generated JavaScript** in `dist/` to see the injected instrumentation code
2. **Modify the configuration** in `tsconfig.json` to experiment with different settings
3. **Add your own services** following the same patterns
4. **Try error scenarios** to see automatic error recording in action

## Troubleshooting

- **No spans appear**: Make sure ts-patch is installed and the build completed successfully
- **Transformer not working**: Check that the transformer path in `tsconfig.json` is correct
- **Jaeger not receiving traces**: Verify Jaeger is running on the correct ports
