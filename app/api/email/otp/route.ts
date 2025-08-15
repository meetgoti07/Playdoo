import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, otp, name } = body;

    if (!to || !otp || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, otp, name' },
        { status: 400 }
      );
    }

    const jobId = await emailService.sendOTP(to, otp, name);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'OTP email queued successfully',
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP email' },
      { status: 500 }
    );
  }
}
