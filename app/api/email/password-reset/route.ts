import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, resetLink, name } = body;

    if (!to || !resetLink || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, resetLink, name' },
        { status: 400 }
      );
    }

    const jobId = await emailService.sendPasswordReset(to, resetLink, name);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Password reset email queued successfully',
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
