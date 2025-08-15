import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";

export async function POST(
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
    const { rating, comment } = await request.json();
    const { id: bookingId } = await params;
    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
        rating
      },
      message: 'Submitting booking review',
    });

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get the booking to ensure it exists and belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: session.user.id // Ensure user owns the booking
      },
      include: {
        review: true // Check if review already exists
      }
    });

    if (!booking) {
      return new Response('Booking not found', { status: 404 });
    }

    // Only allow reviews for completed bookings
    if (booking.status !== BookingStatus.COMPLETED) {
      return Response.json(
        { error: 'Reviews can only be submitted for completed bookings' },
        { status: 400 }
      );
    }

    // Check if review already exists
    if (booking.review) {
      return Response.json(
        { error: 'Review already exists for this booking' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        facilityId: booking.facilityId,
        bookingId: booking.id,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
      }
    });

    // Update facility rating (calculate average)
    const facilityReviews = await prisma.review.findMany({
      where: { 
        facilityId: booking.facilityId,
        isApproved: true,
        isHidden: false
      }
    });

    const averageRating = facilityReviews.reduce((sum, r) => sum + r.rating, 0) / facilityReviews.length;
    
    await prisma.facility.update({
      where: { id: booking.facilityId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: facilityReviews.length
      }
    });

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
        reviewId: review.id,
        newFacilityRating: averageRating
      },
      message: 'Successfully submitted booking review',
    });

    return Response.json(review);

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to submit booking review',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
