import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = params;

  try {
    const { newDate, newTime } = await request.json();

    if (!newDate || !newTime) {
      return Response.json(
        { error: 'New date and time are required' },
        { status: 400 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: id,
        newDate,
        newTime,
      },
      message: 'Attempting to modify booking.',
    });

    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        court: true,
        payment: true,
      },
    });

    if (!booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      return Response.json(
        { error: 'Only confirmed bookings can be modified' },
        { status: 400 }
      );
    }

    // Check if the new time slot is available
    const newDateTime = new Date(`${newDate}T${newTime}`);
    const endTime = new Date(newDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour

    const existingBooking = await prisma.booking.findFirst({
      where: {
        courtId: booking.courtId,
        bookingDate: new Date(newDate),
        startTime: newTime,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        },
        id: {
          not: id, // Exclude current booking
        },
      },
    });

    if (existingBooking) {
      return Response.json(
        { error: 'The selected time slot is not available' },
        { status: 400 }
      );
    }

    // Check if modification is allowed (24 hours before original start time)
    const originalDateTime = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`);
    const now = new Date();
    const timeDifference = originalDateTime.getTime() - now.getTime();
    const hoursUntilBooking = timeDifference / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return Response.json(
        { error: 'Cannot modify booking less than 24 hours before start time' },
        { status: 400 }
      );
    }

    // Calculate modification fee (if any)
    const modificationFee = calculateModificationFee(booking, newDate, newTime);

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: id },
      data: {
        bookingDate: new Date(newDate),
        startTime: newTime,
        endTime: endTime.toTimeString().split(' ')[0].substring(0, 5),
        finalAmount: booking.finalAmount + modificationFee,
        updatedAt: new Date(),
      },
      include: {
        facility: true,
        court: true,
        payment: true,
      },
    });

    // TODO: Process additional payment if modification fee > 0
    // This would involve calling payment gateway APIs

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: id,
        modificationFee,
      },
      message: 'Successfully modified booking.',
    });

    return Response.json({
      message: 'Booking modified successfully',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        bookingDate: updatedBooking.bookingDate.toISOString().split('T')[0],
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        finalAmount: updatedBooking.finalAmount,
        modificationFee,
      },
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to modify booking.',
    });

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateModificationFee(booking: any, newDate: string, newTime: string): number {
  // Simple modification fee calculation
  // In a real application, this could be more complex based on:
  // - Time difference between original and new booking
  // - Day of week changes
  // - Peak vs off-peak hours
  // - Facility-specific policies
  
  const originalDate = booking.bookingDate.toISOString().split('T')[0];
  const originalTime = booking.startTime;
  
  // No fee if only time is changed on same day
  if (originalDate === newDate && originalTime !== newTime) {
    return 0;
  }
  
  // Flat fee for date changes
  if (originalDate !== newDate) {
    return 50; // ₹50 modification fee
  }
  
  return 0;
}
