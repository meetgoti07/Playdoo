import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";
import { validateDateFilters, createValidationErrorResponse } from "@/lib/utils/bookingValidation";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as BookingStatus | null;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        filters: { status, startDate, endDate, page, limit }
      },
      message: 'Fetching user bookings',
    });

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    // Validate date filters
    if (startDate || endDate) {
      const dateValidation = validateDateFilters(startDate || undefined, endDate || undefined);
      if (!dateValidation.isValid) {
        globalThis?.logger?.warn({
          meta: { 
            requestId, 
            userId: session.user.id, 
            startDate, 
            endDate,
            errors: dateValidation.errors 
          },
          message: 'Invalid date filters provided',
        });
        return createValidationErrorResponse(dateValidation.errors);
      }

      // Apply validated date filters
      if (dateValidation.sanitizedDates) {
        where.bookingDate = {};
        if (dateValidation.sanitizedDates.startDate) {
          where.bookingDate.gte = dateValidation.sanitizedDates.startDate;
        }
        if (dateValidation.sanitizedDates.endDate) {
          where.bookingDate.lte = dateValidation.sanitizedDates.endDate;
        }
      }
    }

    // Get total count
    const totalCount = await prisma.booking.count({ where });

    // Get bookings with all related data
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'desc' }
      ],
      skip: offset,
      take: limit,
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

    // Transform the bookings to ensure proper date/time serialization
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      bookingDate: booking.bookingDate ? booking.bookingDate.toISOString().split('T')[0] : null,
      startTime: booking.startTime ? booking.startTime.toISOString().split('T')[1]?.split('.')[0] : null,
      endTime: booking.endTime ? booking.endTime.toISOString().split('T')[1]?.split('.')[0] : null,
      payment: booking.payment ? {
        ...booking.payment,
        paidAt: booking.payment.paidAt ? booking.payment.paidAt.toISOString() : null,
        createdAt: booking.payment.createdAt ? booking.payment.createdAt.toISOString() : null,
      } : null,
      review: booking.review ? {
        ...booking.review,
        createdAt: booking.review.createdAt ? booking.review.createdAt.toISOString() : null,
      } : null,
      createdAt: booking.createdAt ? booking.createdAt.toISOString() : null,
      updatedAt: booking.updatedAt ? booking.updatedAt.toISOString() : null,
      cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
      confirmedAt: booking.confirmedAt ? booking.confirmedAt.toISOString() : null,
      completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
      noShowAt: booking.noShowAt ? booking.noShowAt.toISOString() : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingsCount: bookings.length,
        totalCount,
        page,
        totalPages
      },
      message: 'Successfully fetched user bookings',
    });

    return Response.json({
      bookings: transformedBookings,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to fetch user bookings',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
