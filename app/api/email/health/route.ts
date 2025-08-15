import { NextResponse } from 'next/server';
import { performHealthCheck, checkQueueHealth } from '@/lib/email/health';

export async function GET() {
  try {
    const [healthCheck, queueHealth] = await Promise.all([
      performHealthCheck(),
      checkQueueHealth(),
    ]);

    const response = {
      ...healthCheck,
      queue: {
        ...healthCheck.checks.queue,
        health: queueHealth,
      },
    };

    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 206 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
