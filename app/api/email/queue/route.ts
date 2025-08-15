import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

// Get queue metrics
export async function GET(request: NextRequest) {
  try {
    const metrics = await emailService.getQueueMetrics();

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error getting queue metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get queue metrics' },
      { status: 500 }
    );
  }
}

// Queue management operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, grace, limit, type } = body;

    switch (action) {
      case 'pause':
        await emailService.pauseQueue();
        return NextResponse.json({ success: true, message: 'Queue paused' });

      case 'resume':
        await emailService.resumeQueue();
        return NextResponse.json({ success: true, message: 'Queue resumed' });

      case 'clean':
        const cleanedJobs = await emailService.cleanQueue(grace, limit, type);
        return NextResponse.json({
          success: true,
          message: `Cleaned ${cleanedJobs.length} jobs`,
          cleanedJobs,
        });

      case 'retry':
        if (!jobId) {
          return NextResponse.json(
            { error: 'jobId required for retry action' },
            { status: 400 }
          );
        }
        await emailService.retryJob(jobId);
        return NextResponse.json({ success: true, message: 'Job retry requested' });

      case 'remove':
        if (!jobId) {
          return NextResponse.json(
            { error: 'jobId required for remove action' },
            { status: 400 }
          );
        }
        await emailService.removeJob(jobId);
        return NextResponse.json({ success: true, message: 'Job removed' });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: pause, resume, clean, retry, remove' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing queue:', error);
    return NextResponse.json(
      { error: 'Failed to manage queue' },
      { status: 500 }
    );
  }
}
