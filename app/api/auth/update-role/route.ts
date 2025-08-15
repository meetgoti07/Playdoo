import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['user', 'facility_owner'], { message: 'Invalid role' }),
});

export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      globalThis?.logger?.error({
        meta: {
          requestId,
          endpoint: '/api/auth/update-role',
          method: 'PUT',
        },
        message: 'Unauthorized access attempt.',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        endpoint: '/api/auth/update-role',
        method: 'PUT',
        newRole: validatedData.role,
      },
      message: 'Updating user role.',
    });

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: validatedData.role },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        oldRole: session.user.role,
        newRole: validatedData.role,
      },
      message: 'User role updated successfully.',
    });

    return NextResponse.json({ 
      message: 'Role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/auth/update-role',
        method: 'PUT',
      },
      message: 'Failed to update user role.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
