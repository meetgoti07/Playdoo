import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check user role
    if (session.user.role !== "facility_owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get('courtId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    if (!courtId || dayOfWeek === null) {
      return Response.json(
        { error: 'courtId and dayOfWeek are required' },
        { status: 400 }
      );
    }

    // Verify court ownership
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        facility: {
          ownerId: session.user.id,
        },
      },
    });

    if (!court) {
      return new Response('Court not found or access denied', { status: 404 });
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: courtId,
        dayOfWeek: parseInt(dayOfWeek),
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId: courtId,
        dayOfWeek: dayOfWeek,
        slotsCount: timeSlots.length,
        action: "fetch_time_slots",
      },
      message: 'Time slots retrieved successfully.',
    });

    return Response.json({
      timeSlots,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to retrieve time slots.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
