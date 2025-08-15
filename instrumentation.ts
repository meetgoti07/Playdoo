import type { Logger } from 'pino';

// UPDATE: Added 'isInstrumented' to prevent re-initialization.
declare global {
  var isInstrumented: boolean | undefined;
  var logger: Logger | undefined;
  var metrics: {
    registry: any;
  } | undefined;
}

export async function register() {
  // UPDATE: This block ensures the instrumentation code runs only once.
  if (globalThis.isInstrumented) {
    return;
  }
  globalThis.isInstrumented = true;

  // Only run in Node.js runtime (server-side) and not in browser
  if (typeof window === 'undefined' && process?.env?.NEXT_RUNTIME === "nodejs") {
    try {
      console.log("Initializing Observability: Logs, Metrics, and Traces...");

      // Dynamic imports for server-only modules
      const [
        { default: pino },
        { default: pinoLoki },
        { Registry, collectDefaultMetrics },
        { registerOTel }
      ] = await Promise.all([
        import('pino'),
        import('pino-loki'), 
        import('prom-client'),
        import('@vercel/otel')
      ]);

      const transport = pinoLoki({
        host: 'http://loki:3100', // Loki server address
        batching: true, // Enable batching of logs for better performance
        interval: 5, // Send logs every 5 seconds when batching
        labels: { app: 'odoofinal' }, // Add application label to all logs
        replaceTimestamp: false // Keep original timestamps
      });

      // Initialize global logger
      globalThis.logger = pino(transport);

      // Initialize Prometheus metrics
      const prometheusRegistry = new Registry();
      collectDefaultMetrics({
        register: prometheusRegistry
      });

      // Initialize global metrics
      globalThis.metrics = {
        registry: prometheusRegistry
      };

      // Vercel OTel for traces - service name should match OTEL_SERVICE_NAME
      registerOTel({ 
        serviceName: 'odoofinal',
      });

      console.log("Observability initialization complete.");
    } catch (error) {
      console.error("Failed to initialize observability:", error);
    }
  }
}