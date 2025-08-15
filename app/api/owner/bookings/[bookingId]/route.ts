import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(
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

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId,
        action: "fetch_booking_details",
      },
      message: 'Fetching booking details.',
    });

    // Verify booking ownership and fetch details
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        facility: {
          ownerId: session.user.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            userProfile: {
              select: {
                avatar: true,
                emergencyContact: true,
                emergencyPhone: true,
              },
            },
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            description: true,
          },
        },
        timeSlot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
          },
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
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        bookingCoupons: {
          include: {
            coupon: {
              select: {
                code: true,
                name: true,
                discountType: true,
                discountValue: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return new Response('Booking not found or access denied', { status: 404 });
    }

    // Format the response
    const bookingDetails = {
      id: booking.id,
      bookingDate: booking.bookingDate.toISOString().split('T')[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalHours: booking.totalHours,
      pricePerHour: booking.pricePerHour,
      totalAmount: booking.totalAmount,
      platformFee: booking.platformFee,
      tax: booking.tax,
      finalAmount: booking.finalAmount,
      status: booking.status,
      specialRequests: booking.specialRequests,
      cancellationReason: booking.cancellationReason,
      cancelledAt: booking.cancelledAt?.toISOString(),
      confirmedAt: booking.confirmedAt?.toISOString(),
      completedAt: booking.completedAt?.toISOString(),
      noShowAt: booking.noShowAt?.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      user: booking.user,
      facility: booking.facility,
      court: booking.court,
      timeSlot: booking.timeSlot ? {
        ...booking.timeSlot,
        date: booking.timeSlot.date.toISOString().split('T')[0],
      } : null,
      payment: booking.payment ? {
        ...booking.payment,
        paidAt: booking.payment.paidAt?.toISOString(),
      } : null,
      review: booking.review,
      coupons: booking.bookingCoupons.map(bc => ({
        discountAmount: bc.discountAmount,
        coupon: bc.coupon,
      })),
    };

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId,
        customerEmail: booking.user.email,
      },
      message: 'Booking details fetched successfully.',
    });

    return Response.json({
      booking: bookingDetails,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
        bookingId: params.bookingId,
      },
      message: 'Failed to fetch booking details.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
