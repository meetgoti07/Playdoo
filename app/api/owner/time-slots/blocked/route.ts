import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET() {
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

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "fetch_blocked_time_slots",
      },
      message: 'Fetching blocked time slots for facility owner.',
    });

    // Get blocked time slots for the owner's facilities
    const blockedSlots = await prisma.timeSlot.findMany({
      where: {
        isBlocked: true,
        court: {
          facility: {
            ownerId: session.user.id,
          },
        },
        // Only show future or current blocked slots
        date: {
          gte: new Date(),
        },
      },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            facility: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const formattedSlots = blockedSlots.map((slot) => ({
      id: slot.id,
      courtId: slot.courtId,
      date: slot.date.toISOString().split('T')[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBlocked: slot.isBlocked,
      blockReason: slot.blockReason,
      isBooked: slot.isBooked,
      price: slot.price,
      court: slot.court,
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        blockedSlotsCount: formattedSlots.length,
      },
      message: 'Blocked time slots fetched successfully.',
    });

    return Response.json({
      blockedSlots: formattedSlots,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to fetch blocked time slots.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
