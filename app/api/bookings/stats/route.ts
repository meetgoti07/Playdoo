import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { BookingStatus } from "@/lib/generated/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
      },
      message: 'Fetching user booking statistics',
    });

    const userId = session.user.id;
    const now = new Date();

    // Get booking statistics
    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalSpentResult
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { userId }
      }),
      
      // Upcoming bookings (confirmed and future)
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.CONFIRMED,
          bookingDate: { gte: now.toISOString().split('T')[0] }
        }
      }),
      
      // Completed bookings
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.COMPLETED
        }
      }),
      
      // Cancelled bookings
      prisma.booking.count({
        where: {
          userId,
          status: BookingStatus.CANCELLED
        }
      }),
      
      // Total amount spent (only completed bookings)
      prisma.booking.aggregate({
        where: {
          userId,
          status: BookingStatus.COMPLETED
        },
        _sum: {
          finalAmount: true
        }
      })
    ]);

    const stats = {
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalSpent: totalSpentResult._sum.finalAmount || 0,
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        stats
      },
      message: 'Successfully fetched user booking statistics',
    });

    return Response.json(stats);

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to fetch user booking statistics',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
