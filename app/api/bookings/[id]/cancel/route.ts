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
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: id,
      },
      message: 'Attempting to cancel booking.',
    });

    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
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
        { error: 'Only confirmed bookings can be cancelled' },
        { status: 400 }
      );
    }

    // Check if booking can be cancelled (24 hours before start time)
    const bookingDateTime = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`);
    const now = new Date();
    const timeDifference = bookingDateTime.getTime() - now.getTime();
    const hoursUntilBooking = timeDifference / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return Response.json(
        { error: 'Cannot cancel booking less than 24 hours before start time' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const updatedBooking = await prisma.booking.update({
      where: { id: id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // TODO: Process refund if payment was completed
    // This would involve calling payment gateway APIs for refund

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: id,
      },
      message: 'Successfully cancelled booking.',
    });

    return Response.json({
      message: 'Booking cancelled successfully',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        cancelledAt: updatedBooking.cancelledAt?.toISOString(),
      },
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to cancel booking.',
    });

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
