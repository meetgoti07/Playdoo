import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';
import { z } from 'zod';

const checkUserSchema = z.object({
  email: z.email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/auth/check-user',
      },
      message: 'Checking if user exists in database.',
    });

    const body = await request.json();
    const { email } = checkUserSchema.parse(body);

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    const userExists = !!user;
    const isEmailVerified = user?.emailVerified ? true : false;

    globalThis?.logger?.info({
      meta: {
        requestId,
        email: email.substring(0, 3) + '***', // Partially mask email for privacy
        userExists,
        isEmailVerified,
      },
      message: 'User existence check completed.',
    });

    return NextResponse.json({
      exists: userExists,
      emailVerified: isEmailVerified,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/auth/check-user',
      },
      message: 'Failed to check user existence.',
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
