import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, verificationLink, name } = body;

    if (!to || !verificationLink || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, verificationLink, name' },
        { status: 400 }
      );
    }

    const jobId = await emailService.sendEmailVerification(to, verificationLink, name);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Email verification queued successfully',
    });
  } catch (error) {
    console.error('Error sending email verification:', error);
    return NextResponse.json(
      { error: 'Failed to send email verification' },
      { status: 500 }
    );
  }
}
