import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { BookingStatus } from '@/lib/generated/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
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

    const { bookingId } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = Object.values(BookingStatus);
    if (!validStatuses.includes(status)) {
      return Response.json(
        { error: 'Invalid booking status' },
        { status: 400 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId,
        newStatus: status,
        action: "update_booking_status",
      },
      message: 'Updating booking status.',
    });

    // Verify booking ownership
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        facility: {
          ownerId: session.user.id,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        facility: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingBooking) {
      return new Response('Booking not found or access denied', { status: 404 });
    }

    // Update booking status with appropriate timestamp
    const updateData: any = {
      status: status as BookingStatus,
    };

    switch (status) {
      case BookingStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case BookingStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        break;
      case BookingStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
      case BookingStatus.NO_SHOW:
        updateData.noShowAt = new Date();
        break;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        facility: {
          select: {
            name: true,
          },
        },
        court: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update time slot booking status
    if (status === BookingStatus.CANCELLED) {
      await prisma.timeSlot.update({
        where: { id: existingBooking.timeSlotId },
        data: { isBooked: false },
      });
    }

    // TODO: Send notification to user about status change
    // This could be email, SMS, or push notification

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId,
        oldStatus: existingBooking.status,
        newStatus: status,
        customerEmail: existingBooking.user.email,
      },
      message: 'Booking status updated successfully.',
    });

    return Response.json({
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        user: updatedBooking.user,
        facility: updatedBooking.facility,
        court: updatedBooking.court,
        bookingDate: updatedBooking.bookingDate.toISOString().split('T')[0],
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        finalAmount: updatedBooking.finalAmount,
      },
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
        bookingId: params.bookingId,
      },
      message: 'Failed to update booking status.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
