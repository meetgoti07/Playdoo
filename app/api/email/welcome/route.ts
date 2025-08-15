import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name, loginLink } = body;

    if (!to || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name' },
        { status: 400 }
      );
    }

    const jobId = await emailService.sendWelcome(to, name, loginLink);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Welcome email queued successfully',
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
