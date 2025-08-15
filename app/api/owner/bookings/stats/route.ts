import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { startOfDay, startOfWeek, startOfMonth, subMonths, endOfDay, endOfWeek, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check user role
  if (session.user.role !== "facility_owner") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "fetch_booking_stats",
      },
      message: "Fetching comprehensive booking statistics for facility owner",
    });

    const userId = session.user.id;
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const startWeek = startOfWeek(now);
    const endWeek = endOfWeek(now);
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));

    const baseWhere = {
      facility: {
        ownerId: userId,
      },
    };

    // Get total bookings count
    const totalBookings = await prisma.booking.count({
      where: baseWhere,
    });

    // Get bookings by status
    const [pendingBookings, confirmedBookings, completedBookings, cancelledBookings] = await Promise.all([
      prisma.booking.count({
        where: { ...baseWhere, status: "PENDING" },
      }),
      prisma.booking.count({
        where: { ...baseWhere, status: "CONFIRMED" },
      }),
      prisma.booking.count({
        where: { ...baseWhere, status: "COMPLETED" },
      }),
      prisma.booking.count({
        where: { ...baseWhere, status: "CANCELLED" },
      }),
    ]);

    // Get time-based booking counts
    const [todayBookings, weekBookings, monthBookings] = await Promise.all([
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: today,
            lte: endToday,
          },
        },
      }),
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: startWeek,
            lte: endWeek,
          },
        },
      }),
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: startMonth,
            lte: endMonth,
          },
        },
      }),
    ]);

    // Get revenue aggregations
    const [totalRevenueResult, todayRevenueResult, weekRevenueResult, monthRevenueResult, lastMonthRevenueResult] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: today,
            lte: endToday,
          },
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: startWeek,
            lte: endWeek,
          },
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: startMonth,
            lte: endMonth,
          },
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          bookingDate: {
            gte: lastMonth,
            lt: startMonth,
          },
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          finalAmount: true,
        },
      }),
    ]);

    // Extract revenue values
    const totalRevenue = totalRevenueResult._sum.finalAmount || 0;
    const todayRevenue = todayRevenueResult._sum.finalAmount || 0;
    const weekRevenue = weekRevenueResult._sum.finalAmount || 0;
    const monthRevenue = monthRevenueResult._sum.finalAmount || 0;
    const lastMonthRevenue = lastMonthRevenueResult._sum.finalAmount || 0;

    // Calculate growth percentages
    const revenueGrowthPercentage = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthRevenue > 0 ? 100 : 0;

    // Get last month's booking count for growth calculation
    const lastMonthBookingCount = await prisma.booking.count({
      where: {
        ...baseWhere,
        bookingDate: {
          gte: lastMonth,
          lt: startMonth,
        },
      },
    });

    const growthPercentage = lastMonthBookingCount > 0 
      ? ((monthBookings - lastMonthBookingCount) / lastMonthBookingCount) * 100 
      : monthBookings > 0 ? 100 : 0;

    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      weekBookings,
      monthBookings,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
      revenueGrowthPercentage: Math.round(revenueGrowthPercentage * 100) / 100,
    };

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        statsOverview: {
          totalBookings: stats.totalBookings,
          totalRevenue: stats.totalRevenue,
          monthBookings: stats.monthBookings,
          growthPercentage: stats.growthPercentage,
        },
      },
      message: "Comprehensive booking statistics fetched successfully",
    });

    return Response.json({ stats });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to fetch booking statistics",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
