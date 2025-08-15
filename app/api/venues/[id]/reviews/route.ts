import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { BookingStatus } from "@/lib/generated/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID();
  const { id: venueId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: `/api/venues/${venueId}/reviews`,
        venueId,
        page,
        limit,
      },
      message: 'Fetching venue reviews.',
    });

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Check if venue exists
    const venue = await prisma.facility.findUnique({
      where: { id: venueId },
      select: { id: true }
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Fetch reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: {
          facilityId: venueId,
          isApproved: true,
          isHidden: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          booking: {
            select: {
              id: true,
              court: {
                select: {
                  sportType: true,
                  name: true,
                },
              },
              bookingDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          facilityId: venueId,
          isApproved: true,
          isHidden: false,
        },
      }),
    ]);

    // Calculate rating statistics
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        facilityId: venueId,
        isApproved: true,
        isHidden: false,
      },
      _count: {
        rating: true,
      },
    });

    // Calculate average rating
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

    // Transform reviews for response
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      userId: review.user.id,
      userName: review.user.name,
      userAvatar: review.user.image,
      rating: review.rating,
      comment: review.comment,
      sportType: review.booking.court.sportType,
      courtName: review.booking.court.name,
      bookingDate: review.booking.bookingDate,
      createdAt: review.createdAt,
      isVerified: true, // All approved reviews are considered verified
    }));

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingStats.forEach(stat => {
      ratingDistribution[stat.rating as keyof typeof ratingDistribution] = stat._count.rating;
    });

    const totalPages = Math.ceil(totalCount / limit);

    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: `/api/venues/${venueId}/reviews`,
        venueId,
        reviewsCount: reviews.length,
        totalCount,
        averageRating,
      },
      message: 'Venue reviews fetched successfully.',
    });

    return NextResponse.json({
      reviews: transformedReviews,
      total: totalCount,
      average: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: totalPages,
        total_count: totalCount,
      },
    });

  } catch (error) {
    console.error('Venue reviews API Error:', error);
    
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: `/api/venues/${venueId}/reviews`,
        venueId,
      },
      message: 'Failed to fetch venue reviews.',
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { bookingId, rating, comment } = await request.json();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        venueId,
        bookingId,
        rating,
      },
      message: 'Submitting venue review.',
    });

    // Validate input
    if (!bookingId) {
      return Response.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get the booking to ensure it exists, belongs to the user, and is for this venue
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: session.user.id,
        facilityId: venueId,
      },
      include: {
        review: true,
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
      },
    });

    if (!booking) {
      return Response.json(
        { error: 'Booking not found or does not belong to you' },
        { status: 404 }
      );
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
        facilityId: venueId,
        bookingId: bookingId,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
        isApproved: true, // Auto-approve for now, you can add moderation later
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            court: {
              select: {
                name: true,
                sportType: true,
              },
            },
            bookingDate: true,
          },
        },
      },
    });

    // Update facility rating (calculate average)
    const facilityReviews = await prisma.review.findMany({
      where: { 
        facilityId: venueId,
        isApproved: true,
        isHidden: false,
      },
    });

    const averageRating = facilityReviews.reduce((sum, r) => sum + r.rating, 0) / facilityReviews.length;
    
    await prisma.facility.update({
      where: { id: venueId },
      data: {
        rating: Math.round(averageRating * 10) / 10,
        totalReviews: facilityReviews.length,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        venueId,
        bookingId,
        reviewId: review.id,
        newFacilityRating: averageRating,
      },
      message: 'Venue review submitted successfully.',
    });

    // Transform review for response
    const transformedReview = {
      id: review.id,
      userId: review.user.id,
      userName: review.user.name,
      userAvatar: review.user.image,
      rating: review.rating,
      comment: review.comment,
      sportType: review.booking.court.sportType,
      courtName: review.booking.court.name,
      bookingDate: review.booking.bookingDate,
      createdAt: review.createdAt,
      isVerified: true,
    };

    return Response.json({
      review: transformedReview,
      newAverageRating: Math.round(averageRating * 10) / 10,
      totalReviews: facilityReviews.length,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        userId: session.user.id,
        venueId,
      },
      message: 'Failed to submit venue review.',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
