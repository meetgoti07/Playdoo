import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { userId } = params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        adminId: session.user.id,
        targetUserId: userId,
      },
      message: "Admin fetching user analytics",
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hashId: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        status: true,
        city: true,
        state: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Get booking statistics
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalSpentResult,
      favoriteSportResult,
      favoriteFacilityResult
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { userId },
      }),
      
      // Completed bookings
      prisma.booking.count({
        where: { 
          userId,
          status: "COMPLETED"
        },
      }),
      
      // Cancelled bookings
      prisma.booking.count({
        where: { 
          userId,
          status: "CANCELLED"
        },
      }),
      
      // Total amount spent
      prisma.payment.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          booking: {
            userId,
          },
          status: "COMPLETED",
        },
      }),
      
      // Favorite sport (most booked sport type)
      prisma.booking.groupBy({
        by: ['courtId'],
        _count: {
          id: true,
        },
        where: { userId },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 1,
      }),
      
      // Favorite facility (most booked facility)
      prisma.booking.groupBy({
        by: ['facilityId'],
        _count: {
          id: true,
        },
        where: { userId },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 1,
      }),
    ]);

    // Get favorite sport name
    let favoriteSport = "N/A";
    if (favoriteSportResult.length > 0) {
      const court = await prisma.court.findUnique({
        where: { id: favoriteSportResult[0].courtId },
        select: { sportType: true },
      });
      favoriteSport = court?.sportType || "N/A";
    }

    // Get favorite facility name
    let favoriteFacility = "N/A";
    if (favoriteFacilityResult.length > 0) {
      const facility = await prisma.facility.findUnique({
        where: { id: favoriteFacilityResult[0].facilityId },
        select: { name: true },
      });
      favoriteFacility = facility?.name || "N/A";
    }

    const totalSpent = totalSpentResult._sum.totalAmount || 0;
    const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;
    
    
    const bookingFrequency = totalBookings / 28;

    // Get booking trend (last 12 months)
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        date,
        name: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      });
    }

    const bookingTrend = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const [bookings, amountResult] = await Promise.all([
          prisma.booking.count({
            where: {
              userId,
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          prisma.payment.aggregate({
            _sum: {
              totalAmount: true,
            },
            where: {
              booking: {
                userId,
              },
              status: "COMPLETED",
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
        ]);

        return {
          month: month.name,
          bookings,
          amount: amountResult._sum.totalAmount || 0,
        };
      })
    );

    // Get sport preferences
    const sportBookings = await prisma.booking.groupBy({
      by: ['courtId'],
      _count: {
        id: true,
      },
      where: { userId },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const sportPreference = await Promise.all(
      sportBookings.map(async (booking) => {
        const court = await prisma.court.findUnique({
          where: { id: booking.courtId },
          select: { sportType: true },
        });

        return {
          sport: court?.sportType || 'Unknown',
          bookings: booking._count.id,
        };
      })
    );

    // Aggregate by sport type and calculate percentages
    const sportMap = new Map();
    sportPreference.forEach((sport) => {
      if (sportMap.has(sport.sport)) {
        sportMap.set(sport.sport, sportMap.get(sport.sport) + sport.bookings);
      } else {
        sportMap.set(sport.sport, sport.bookings);
      }
    });

    const aggregatedSportPreference = Array.from(sportMap.entries()).map(([sport, bookings]) => ({
      sport,
      bookings,
      percentage: totalBookings > 0 ? (bookings / totalBookings) * 100 : 0,
    }));

    // Get facility usage
    const facilityBookings = await prisma.booking.groupBy({
      by: ['facilityId'],
      _count: {
        id: true,
      },
      where: { userId },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const facilityUsage = await Promise.all(
      facilityBookings.map(async (booking) => {
        const [facility, lastBooking] = await Promise.all([
          prisma.facility.findUnique({
            where: { id: booking.facilityId },
            select: { name: true },
          }),
          prisma.booking.findFirst({
            where: { 
              userId,
              facilityId: booking.facilityId,
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        return {
          facilityName: facility?.name || 'Unknown',
          bookings: booking._count.id,
          lastBooked: lastBooking?.createdAt.toISOString() || '',
        };
      })
    );

    // Get time preferences (simplified - group by hour)
    const timePreferenceData = await prisma.booking.findMany({
      where: { userId },
      select: { startTime: true },
    });

    const timeMap = new Map();
    timePreferenceData.forEach((booking) => {
      if (booking.startTime) {
        // startTime is stored as a string in HH:MM format
        const timeStr = booking.startTime.toString();
        const hour = parseInt(timeStr.split(':')[0]);
        timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
      }
    });

    const timePreference = Array.from(timeMap.entries()).map(([hour, bookings]) => ({
      hour,
      bookings,
    })).sort((a, b) => a.hour - b.hour);

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        facility: {
          select: { name: true },
        },
        court: {
          select: { name: true, sportType: true },
        },
        payment: {
          select: { totalAmount: true },
        },
      },
    });

    const formattedRecentBookings = recentBookings.map((booking) => ({
      id: booking.id,
      facilityName: booking.facility.name,
      courtName: booking.court.name,
      sportType: booking.court.sportType,
      date: booking.createdAt.toISOString(), // Use createdAt instead of date
      startTime: booking.startTime?.toString() || '',
      endTime: booking.endTime?.toString() || '',
      status: booking.status,
      amount: booking.payment?.totalAmount || 0,
    }));

    const analyticsData = {
      user,
      stats: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalSpent,
        averageBookingValue,
        favoriteSport,
        favoriteFacility,
        bookingFrequency,
      },
      bookingTrend,
      sportPreference: aggregatedSportPreference,
      facilityUsage,
      timePreference,
      recentBookings: formattedRecentBookings,
    };

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        adminId: session.user.id,
        targetUserId: userId,
        totalBookings,
        totalSpent,
      },
      message: "User analytics fetched successfully",
    });

    return Response.json(analyticsData);

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch user analytics",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
