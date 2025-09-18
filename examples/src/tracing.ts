/**
 * OpenTelemetry setup for the example application
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'ts-otel-weaver-example',
    [ATTR_SERVICE_VERSION]: '1.0.0',
  }),
  // Use Console exporter for development and demonstration
  traceExporter: new ConsoleSpanExporter(),
});

// Initialize the SDK
sdk.start();

console.log('🔍 OpenTelemetry initialized successfully');
console.log('📊 Traces will be exported to console for demonstration');
console.log('💡 This example shows how ts-otel-weaver automatically instruments your business logic');

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('🔍 OpenTelemetry terminated'))
    .catch((error) => console.log('❌ Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});
