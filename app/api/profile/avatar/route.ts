import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        endpoint: '/api/profile/avatar',
        method: 'POST',
      },
      message: 'Updating user profile picture.',
    });

    // Update user image and userProfile avatar
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user table
      await tx.user.update({
        where: { id: session.user.id },
        data: { image: imageUrl },
      });

      // Update or create user profile with avatar
      await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: { avatar: imageUrl },
        create: {
          userId: session.user.id,
          avatar: imageUrl,
        },
      });

      // Return updated user
      return await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          userProfile: {
            select: {
              avatar: true,
            },
          },
        },
      });
    });

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
      },
      message: 'Profile picture updated successfully.',
    });

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/profile/avatar',
        method: 'POST',
      },
      message: 'Failed to update profile picture.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const requestId = crypto.randomUUID();
  
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        endpoint: '/api/profile/avatar',
        method: 'DELETE',
      },
      message: 'Deleting user profile picture.',
    });

    // Remove user image and userProfile avatar
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user table
      await tx.user.update({
        where: { id: session.user.id },
        data: { image: null },
      });

      // Update user profile if it exists
      const existingProfile = await tx.userProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (existingProfile) {
        await tx.userProfile.update({
          where: { userId: session.user.id },
          data: { avatar: null },
        });
      }

      // Return updated user
      return await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          userProfile: {
            select: {
              avatar: true,
            },
          },
        },
      });
    });

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
      },
      message: 'Profile picture deleted successfully.',
    });

    return NextResponse.json({
      message: 'Profile picture deleted successfully',
      user: updatedUser,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/profile/avatar',
        method: 'DELETE',
      },
      message: 'Failed to delete profile picture.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
