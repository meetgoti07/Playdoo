import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { courtId, date, startTime, endTime, blockReason } = body;

    if (!courtId || !date || !startTime || !endTime) {
      return Response.json(
        { error: 'courtId, date, startTime, and endTime are required' },
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

    // Check if there's already a booking for this time slot
    const existingSlot = await prisma.timeSlot.findFirst({
      where: {
        courtId: courtId,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
        endTime: new Date(`1970-01-01T${endTime}:00.000Z`),
      },
    });

    if (existingSlot) {
      if (existingSlot.isBooked) {
        return Response.json(
          { error: 'This time slot is already booked and cannot be blocked' },
          { status: 400 }
        );
      }
      
      // Update existing slot to blocked
      const blockedSlot = await prisma.timeSlot.update({
        where: { id: existingSlot.id },
        data: {
          isBlocked: true,
          blockReason: blockReason || 'Blocked by owner',
        },
      });

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          courtId: courtId,
          slotId: blockedSlot.id,
          date: date,
          startTime: startTime,
          endTime: endTime,
          action: "update_block_slot",
        },
        message: 'Time slot blocked successfully.',
      });

      return Response.json({
        timeSlot: blockedSlot,
        message: 'Time slot blocked successfully',
        success: true,
      });
    } else {
      // Create new blocked time slot
      const blockedSlot = await prisma.timeSlot.create({
        data: {
          courtId: courtId,
          date: new Date(date),
          startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
          endTime: new Date(`1970-01-01T${endTime}:00.000Z`),
          isBlocked: true,
          blockReason: blockReason || 'Blocked by owner',
          price: court.pricePerHour,
        },
      });

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          courtId: courtId,
          slotId: blockedSlot.id,
          date: date,
          startTime: startTime,
          endTime: endTime,
          action: "create_block_slot",
        },
        message: 'Time slot created and blocked successfully.',
      });

      return Response.json({
        timeSlot: blockedSlot,
        message: 'Time slot created and blocked successfully',
        success: true,
      });
    }
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to block time slot.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const timeSlotId = searchParams.get('timeSlotId');

    if (!timeSlotId) {
      return Response.json(
        { error: 'timeSlotId is required' },
        { status: 400 }
      );
    }

    // Verify time slot ownership and that it's blocked
    const timeSlot = await prisma.timeSlot.findFirst({
      where: {
        id: timeSlotId,
        court: {
          facility: {
            ownerId: session.user.id,
          },
        },
      },
    });

    if (!timeSlot) {
      return new Response('Time slot not found or access denied', { status: 404 });
    }

    if (timeSlot.isBooked) {
      return Response.json(
        { error: 'Cannot unblock a booked time slot' },
        { status: 400 }
      );
    }

    // If the slot was manually created for blocking, delete it
    // If it was an existing slot, just unblock it
    if (timeSlot.isBlocked && !timeSlot.isBooked) {
      await prisma.timeSlot.update({
        where: { id: timeSlotId },
        data: {
          isBlocked: false,
          blockReason: null,
        },
      });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        timeSlotId: timeSlotId,
        action: "unblock_slot",
      },
      message: 'Time slot unblocked successfully.',
    });

    return Response.json({
      message: 'Time slot unblocked successfully',
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to unblock time slot.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
