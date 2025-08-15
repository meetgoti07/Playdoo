import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slotId: string } }
) {
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

    const { slotId } = params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        slotId,
        action: "unblock_time_slot",
      },
      message: 'Unblocking time slot.',
    });

    // Verify slot ownership and get slot details
    const timeSlot = await prisma.timeSlot.findFirst({
      where: {
        id: slotId,
        court: {
          facility: {
            ownerId: session.user.id,
          },
        },
      },
      include: {
        court: {
          select: {
            name: true,
            facility: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!timeSlot) {
      return Response.json(
        { error: 'Time slot not found or access denied' },
        { status: 404 }
      );
    }

    if (!timeSlot.isBlocked) {
      return Response.json(
        { error: 'Time slot is not currently blocked' },
        { status: 400 }
      );
    }

    if (timeSlot.isBooked) {
      return Response.json(
        { error: 'Cannot unblock a booked time slot' },
        { status: 400 }
      );
    }

    // Unblock the time slot
    const updatedSlot = await prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        isBlocked: false,
        blockReason: null,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        slotId,
        courtName: timeSlot.court.name,
        facilityName: timeSlot.court.facility.name,
        date: timeSlot.date.toISOString().split('T')[0],
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
      },
      message: 'Time slot unblocked successfully.',
    });

    return Response.json({
      message: 'Time slot unblocked successfully',
      timeSlot: {
        id: updatedSlot.id,
        date: updatedSlot.date.toISOString().split('T')[0],
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
        isBlocked: updatedSlot.isBlocked,
      },
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
        slotId: params.slotId,
      },
      message: 'Failed to unblock time slot.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
