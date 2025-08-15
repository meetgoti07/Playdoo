// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
// Ensure this path points to your instrumentation file
import { register } from '../../../instrumentation';

register();

export async function GET() {
  // Test logging to Loki
  if (global.logger) {
    global.logger.info('Metrics endpoint accessed', {
      timestamp: new Date().toISOString(),
      endpoint: '/api/metrics',
      method: 'GET'
    });
  }

  const registry = global.metrics?.registry;

  if (!registry) {
    return new NextResponse('Metrics not initialized', { status: 500 });
  }

  const metrics = await registry.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': registry.contentType,
    },
  });
}