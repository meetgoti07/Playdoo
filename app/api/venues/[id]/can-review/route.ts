import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id: venueId } = await params;
  const requestId = crypto.randomUUID();

  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        venueId,
      },
      message: 'Checking user review eligibility for venue.',
    });

    // Find completed bookings for this user at this venue that don't have reviews yet
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        facilityId: venueId,
        status: BookingStatus.COMPLETED,
        review: null, // No review exists yet
      },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Get existing reviews for this user at this venue
    const existingReviews = await prisma.review.findMany({
      where: {
        userId: session.user.id,
        facilityId: venueId,
      },
      include: {
        booking: {
          include: {
            court: {
              select: {
                name: true,
                sportType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const canReview = eligibleBookings.length > 0;

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        venueId,
        eligibleBookingsCount: eligibleBookings.length,
        existingReviewsCount: existingReviews.length,
        canReview,
      },
      message: 'User review eligibility checked successfully.',
    });

    return Response.json({
      canReview,
      eligibleBookings: eligibleBookings.map(booking => ({
        id: booking.id,
        bookingDate: booking.bookingDate,
        court: booking.court,
        completedAt: booking.completedAt,
      })),
      existingReviews: existingReviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        booking: {
          id: review.booking.id,
          court: review.booking.court,
          bookingDate: review.booking.bookingDate,
        },
      })),
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        userId: session.user.id,
        venueId,
      },
      message: 'Failed to check user review eligibility.',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
