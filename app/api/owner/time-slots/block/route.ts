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

    const { courtId, date, startTime, endTime, reason } = await request.json();

    if (!courtId || !date || !startTime || !endTime) {
      return Response.json(
        { error: 'courtId, date, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
        date,
        startTime,
        endTime,
        action: "block_time_slot",
      },
      message: 'Blocking time slot.',
    });

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
      return Response.json(
        { error: 'Court not found or access denied' },
        { status: 404 }
      );
    }

    // Validate date is not in the past
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (slotDate < today) {
      return Response.json(
        { error: 'Cannot block time slots in the past' },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return Response.json(
        { error: 'Invalid time format. Use HH:mm format (e.g., 09:30)' },
        { status: 400 }
      );
    }

    // Validate time logic
    if (startTime >= endTime) {
      return Response.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Convert time strings to proper DateTime objects for comparison and storage
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTimeDate = new Date();
    startTimeDate.setHours(startHour, startMinute, 0, 0);
    
    const endTimeDate = new Date();
    endTimeDate.setHours(endHour, endMinute, 0, 0);

    // Check if there are any existing bookings in this time range
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: courtId,
        bookingDate: slotDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: endTimeDate } },
              { endTime: { gt: startTimeDate } },
            ],
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      return Response.json(
        { 
          error: 'Cannot block time slot - there are existing bookings in this time range',
          conflictingBookings: existingBookings.length
        },
        { status: 409 }
      );
    }

    // Find or create time slots in the specified range and block them
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: courtId,
        date: slotDate,
        OR: [
          {
            AND: [
              { startTime: { lte: endTimeDate } },
              { endTime: { gt: startTimeDate } },
            ],
          },
        ],
      },
    });

    // Block existing time slots
    if (timeSlots.length > 0) {
      await prisma.timeSlot.updateMany({
        where: {
          id: {
            in: timeSlots.map(slot => slot.id),
          },
        },
        data: {
          isBlocked: true,
          blockReason: reason || 'Blocked by owner',
        },
      });
    } else {
      // Create a new blocked time slot if none exist
      await prisma.timeSlot.create({
        data: {
          courtId: courtId,
          date: slotDate,
          startTime: startTimeDate,
          endTime: endTimeDate,
          isBlocked: true,
          blockReason: reason || 'Blocked by owner',
          isBooked: false,
          price: court.pricePerHour,
        },
      });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
        date,
        startTime,
        endTime,
        slotsAffected: Math.max(timeSlots.length, 1),
      },
      message: 'Time slot blocked successfully.',
    });

    return Response.json({
      message: 'Time slot blocked successfully',
      slotsAffected: Math.max(timeSlots.length, 1),
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
        courtId: request.body ? JSON.stringify(request.body) : 'unknown',
      },
      message: 'Failed to block time slot.',
    });

    // Log the specific error details for debugging
    console.error('Time slot blocking error:', error);

    return Response.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
