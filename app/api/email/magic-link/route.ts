
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, magicLink, name } = body;

    if (!to || !magicLink || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, magicLink, name' },
        { status: 400 }
      );
    }

    const jobId = await emailService.sendMagicLink(to, magicLink, name);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Magic link email queued successfully',
    });
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link email' },
      { status: 500 }
    );
  }
}
