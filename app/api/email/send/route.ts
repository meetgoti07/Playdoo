import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

// Send custom email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, template, subject, variables, priority, sendAt, attachments } = body;

    if (!to || !template || !variables) {
      return NextResponse.json(
        { error: 'Missing required fields: to, template, variables' },
        { status: 400 }
      );
    }

    const emailData = {
      to,
      template,
      subject,
      variables,
      priority,
      sendAt: sendAt ? new Date(sendAt) : undefined,
      attachments,
    };

    const jobId = await emailService.sendEmail(emailData);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Email queued successfully',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Send bulk emails
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Missing or invalid emails array' },
        { status: 400 }
      );
    }

    const emailsData = emails.map(email => ({
      ...email,
      sendAt: email.sendAt ? new Date(email.sendAt) : undefined,
    }));

    const jobIds = await emailService.sendBulkEmails(emailsData);

    return NextResponse.json({
      success: true,
      jobIds,
      count: jobIds.length,
      message: 'Bulk emails queued successfully',
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk emails' },
      { status: 500 }
    );
  }
}
