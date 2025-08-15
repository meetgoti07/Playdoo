import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET() {
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

    // Get last 6 months data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        date,
        name: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      });
    }

    // Booking trend data
    const bookingTrend = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const bookings = await prisma.booking.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        return {
          month: month.name,
          bookings,
        };
      })
    );

    // User registration trend
    const userRegistrationTrend = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const users = await prisma.user.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        return {
          month: month.name,
          users,
        };
      })
    );

    // Sport popularity
    const sportPopularity = await prisma.booking.groupBy({
      by: ['courtId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 6,
    });

    const sportPopularityWithNames = await Promise.all(
      sportPopularity.map(async (sport) => {
        const court = await prisma.court.findUnique({
          where: { id: sport.courtId },
          select: { sportType: true },
        });

        return {
          name: court?.sportType || 'Unknown',
          bookings: sport._count.id,
        };
      })
    );

    // Aggregate sport data by sport type
    const sportMap = new Map();
    sportPopularityWithNames.forEach((sport) => {
      if (sportMap.has(sport.name)) {
        sportMap.set(sport.name, sportMap.get(sport.name) + sport.bookings);
      } else {
        sportMap.set(sport.name, sport.bookings);
      }
    });

    const aggregatedSportPopularity = Array.from(sportMap.entries()).map(([name, bookings]) => ({
      name,
      bookings,
    }));

    // Revenue trend
    const revenueTrend = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        const revenue = await prisma.payment.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        return {
          month: month.name,
          revenue: revenue._sum.totalAmount || 0,
        };
      })
    );

    // Facility approval trend
    const facilityApprovalTrend = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
        const endOfMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);

        // Count pending facilities
        const pendingCount = await prisma.facility.count({
          where: {
            status: "PENDING",
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        // Count approved facilities
        const approvedCount = await prisma.facility.count({
          where: {
            status: "APPROVED",
            approvedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        // Count rejected facilities
        const rejectedCount = await prisma.facility.count({
          where: {
            status: "REJECTED",
            rejectedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        return {
          month: month.name,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        };
      })
    );

    const chartData = {
      bookingTrend,
      userRegistrationTrend,
      sportPopularity: aggregatedSportPopularity,
      revenueTrend,
      facilityApprovalTrend,
    };

    return Response.json(chartData);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin chart data",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
