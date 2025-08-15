import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/prismaClient";

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

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: id,
        newDate,
        newTime,
      },
      message: 'Calculating modification fee.',
    });

    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        court: true,
      },
    });

    if (!booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const modificationFee = calculateModificationFee(booking, newDate, newTime);

    return Response.json({
      fee: modificationFee,
      originalAmount: booking.finalAmount,
      newTotal: booking.finalAmount + modificationFee,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to calculate modification fee.',
    });

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateModificationFee(booking: any, newDate: string, newTime: string): number {
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
