import { emailService } from '@/lib/email';
import { validateEmailConfig } from '@/lib/email/config';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    redis: { status: string; message?: string };
    smtp: { status: string; message?: string };
    queue: { status: string; message?: string; metrics?: any };
  };
  timestamp: string;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      redis: { status: 'unknown' },
      smtp: { status: 'unknown' },
      queue: { status: 'unknown' },
    },
    timestamp: new Date().toISOString(),
  };

  let healthyChecks = 0;
  let totalChecks = 3;

  // Check Redis connection
  try {
    await emailService.initialize();
    result.checks.redis = { status: 'healthy', message: 'Redis connection successful' };
    healthyChecks++;
  } catch (error) {
    result.checks.redis = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }

  // Check SMTP configuration
  try {
    const isValidConfig = await validateEmailConfig();
    if (isValidConfig) {
      result.checks.smtp = { status: 'healthy', message: 'SMTP configuration valid' };
      healthyChecks++;
    } else {
      result.checks.smtp = { status: 'unhealthy', message: 'SMTP configuration invalid' };
    }
  } catch (error) {
    result.checks.smtp = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'SMTP check failed',
    };
  }

  // Check queue metrics
  try {
    const metrics = await emailService.getQueueMetrics();
    result.checks.queue = {
      status: 'healthy',
      message: 'Queue operational',
      metrics,
    };
    healthyChecks++;
  } catch (error) {
    result.checks.queue = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Queue check failed',
    };
  }

  // Determine overall status
  if (healthyChecks === totalChecks) {
    result.status = 'healthy';
  } else if (healthyChecks > 0) {
    result.status = 'degraded';
  } else {
    result.status = 'unhealthy';
  }

  return result;
}

export async function checkQueueHealth(): Promise<{
  isHealthy: boolean;
  metrics: any;
  issues: string[];
}> {
  const issues: string[] = [];
  let isHealthy = true;

  try {
    const metrics = await emailService.getQueueMetrics();
    
    // Check for concerning metrics
    if (metrics.failed > 100) {
      issues.push(`High number of failed jobs: ${metrics.failed}`);
      isHealthy = false;
    }
    
    if (metrics.waiting > 1000) {
      issues.push(`High number of waiting jobs: ${metrics.waiting}`);
      isHealthy = false;
    }
    
    if (metrics.active === 0 && metrics.waiting > 0) {
      issues.push('No active workers but jobs are waiting');
      isHealthy = false;
    }

    return { isHealthy, metrics, issues };
  } catch (error) {
    return {
      isHealthy: false,
      metrics: null,
      issues: [`Failed to get queue metrics: ${error}`],
    };
  }
}
