import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { courtId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return Response.json(
      { error: 'Date parameter is required' },
      { status: 400 }
    );
  }

  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
        date,
      },
      message: 'Fetching court availability.',
    });

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          select: {
            operatingHours: true,
          },
        },
      },
    });

    if (!court) {
      return Response.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    // Get existing bookings for the date
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: courtId,
        bookingDate: new Date(date),
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate time slots (assuming 1-hour slots from 6 AM to 11 PM)
    const timeSlots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      
      // Create a date object for comparison
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, 0, 0, 0);
      
      const isBooked = existingBookings.some(
        booking => {
          const bookingStartTime = new Date(booking.startTime);
          return bookingStartTime.getTime() === slotDateTime.getTime();
        }
      );

      timeSlots.push({
        time: timeString,
        available: !isBooked,
        price: court.pricePerHour || 1000, // Default price if not set
      });
    }

    return Response.json({
      slots: timeSlots,
      date,
      courtId,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to fetch court availability.',
    });

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
