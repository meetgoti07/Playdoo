import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";
import { 
  validateBooking, 
  createValidationErrorResponse 
} from "@/lib/utils/bookingValidation";
import { safeCreateDateTime } from "@/lib/utils/dateHelpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id: bookingId } = await params;
    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
      },
      message: 'Fetching booking details',
    });

    // Get the booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: session.user.id // Ensure user owns the booking
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            rating: true,
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true,
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            platformFee: true,
            tax: true,
            totalAmount: true,
            paymentMethod: true,
            status: true,
            transactionId: true,
            paidAt: true,
            createdAt: true,
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          }
        }
      }
    });

    if (!booking) {
      return new Response('Booking not found', { status: 404 });
    }

    // Transform the response to ensure proper date/time serialization
    const transformedBooking = {
      id: booking.id,
      status: booking.status,
      bookingDate: booking.bookingDate ? booking.bookingDate.toISOString().split('T')[0] : null,
      startTime: booking.startTime ? booking.startTime.toISOString().split('T')[1]?.split('.')[0] : null,
      endTime: booking.endTime ? booking.endTime.toISOString().split('T')[1]?.split('.')[0] : null,
      finalAmount: booking.finalAmount,
      createdAt: booking.createdAt ? booking.createdAt.toISOString() : null,
      updatedAt: booking.updatedAt ? booking.updatedAt.toISOString() : null,
      facility: {
        id: booking.facility.id,
        name: booking.facility.name,
        address: booking.facility.address,
        city: booking.facility.city,
        phone: booking.facility.phone,
        rating: booking.facility.rating || 0,
      },
      court: {
        id: booking.court.id,
        name: booking.court.name,
        sportType: booking.court.sportType,
        pricePerHour: booking.court.pricePerHour,
      },
      payment: booking.payment ? {
        id: booking.payment.id,
        status: booking.payment.status,
        transactionId: booking.payment.transactionId || undefined,
        paidAt: booking.payment.paidAt ? booking.payment.paidAt.toISOString() : undefined,
        amount: booking.payment.totalAmount,
      } : undefined,
      user: {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        phone: session.user.phone || undefined,
      },
      review: booking.review ? {
        ...booking.review,
        createdAt: booking.review.createdAt ? booking.review.createdAt.toISOString() : null,
      } : null,
      cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
      confirmedAt: booking.confirmedAt ? booking.confirmedAt.toISOString() : null,
      completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
      noShowAt: booking.noShowAt ? booking.noShowAt.toISOString() : null,
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
      },
      message: 'Successfully fetched booking details',
    });

    return Response.json({ booking: transformedBooking });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to fetch booking details',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { action, cancellationReason } = await request.json();
    const { id: bookingId } = await params;
    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
        action
      },
      message: 'Processing booking action',
    });

    // Get the booking with payment info
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: session.user.id // Ensure user owns the booking
      },
      include: {
        payment: true
      }
    });

    if (!booking) {
      return new Response('Booking not found', { status: 404 });
    }

    // Validate booking data
    const bookingValidation = validateBooking(booking);
    if (!bookingValidation.isValid) {
      globalThis?.logger?.error({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          errors: bookingValidation.errors,
        },
        message: 'Invalid booking data encountered during cancellation',
      });
      return createValidationErrorResponse(
        ["Invalid booking data. Please contact support."],
        500
      );
    }

    if (action === 'cancel') {
      // Check if booking can be cancelled (24 hours before start time)
      const bookingDateTime = safeCreateDateTime(booking.bookingDate, booking.startTime);
      
      if (!bookingDateTime) {
        globalThis?.logger?.error({
          meta: {
            requestId,
            userId: session.user.id,
            bookingId,
            bookingDate: booking.bookingDate,
            startTime: booking.startTime
          },
          message: 'Invalid booking date/time data encountered during cancellation',
        });
        return createValidationErrorResponse(
          ["Invalid booking data. Please contact support."],
          500
        );
      }
      
      const now = new Date();
      const timeDifference = bookingDateTime.getTime() - now.getTime();
      const hoursUntilBooking = timeDifference / (1000 * 60 * 60);

      if (hoursUntilBooking < 24) {
        return Response.json(
          { error: 'Cannot cancel booking less than 24 hours before start time' },
          { status: 400 }
        );
      }

      // Only allow cancellation if booking is confirmed or pending
      if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
        return Response.json(
          { error: 'Booking cannot be cancelled in its current status' },
          { status: 400 }
        );
      }

      // Update booking status to cancelled
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason,
          cancelledAt: new Date()
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              phone: true,
              rating: true,
            }
          },
          court: {
            select: {
              id: true,
              name: true,
              sportType: true,
              pricePerHour: true,
            }
          },
          payment: true
        }
      });

      // Update the time slot to be available again
      await prisma.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: {
          isBooked: false
        }
      });

      // TODO: Process refund if payment was made
      // This would involve calling payment gateway APIs

      // Transform the response to ensure proper date/time serialization
      const transformedBooking = {
        ...updatedBooking,
        bookingDate: updatedBooking.bookingDate ? updatedBooking.bookingDate.toISOString().split('T')[0] : null,
        startTime: updatedBooking.startTime ? updatedBooking.startTime.toISOString().split('T')[1]?.split('.')[0] : null,
        endTime: updatedBooking.endTime ? updatedBooking.endTime.toISOString().split('T')[1]?.split('.')[0] : null,
        payment: updatedBooking.payment ? {
          ...updatedBooking.payment,
          paidAt: updatedBooking.payment.paidAt ? updatedBooking.payment.paidAt.toISOString() : null,
          createdAt: updatedBooking.payment.createdAt ? updatedBooking.payment.createdAt.toISOString() : null,
        } : null,
        createdAt: updatedBooking.createdAt ? updatedBooking.createdAt.toISOString() : null,
        updatedAt: updatedBooking.updatedAt ? updatedBooking.updatedAt.toISOString() : null,
        cancelledAt: updatedBooking.cancelledAt ? updatedBooking.cancelledAt.toISOString() : null,
        confirmedAt: updatedBooking.confirmedAt ? updatedBooking.confirmedAt.toISOString() : null,
        completedAt: updatedBooking.completedAt ? updatedBooking.completedAt.toISOString() : null,
        noShowAt: updatedBooking.noShowAt ? updatedBooking.noShowAt.toISOString() : null,
      };

      globalThis?.logger?.info({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          newStatus: BookingStatus.CANCELLED
        },
        message: 'Successfully cancelled booking',
      });

      return Response.json(transformedBooking);
    }

    return Response.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to process booking action',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
