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

    // Check user role
    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        endpoint: "/api/admin/bookings/stats",
      },
      message: "Admin booking stats requested",
    });

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Current month stats
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      activeUsers,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({
        _sum: { totalAmount: true },
        where: { status: "COMPLETED" },
      }),
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
              },
            },
          },
        },
      }),
    ]);

    // Previous month stats for growth calculation
    const [
      lastMonthBookings,
      lastMonthConfirmed,
      lastMonthPending,
      lastMonthCancelled,
      lastMonthCompleted,
      lastMonthRevenue,
      lastMonthActiveUsers,
    ] = await Promise.all([
      prisma.booking.count({
        where: { createdAt: { lte: lastMonth } },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { lte: lastMonth } },
      }),
      prisma.booking.count({
        where: { status: "PENDING", createdAt: { lte: lastMonth } },
      }),
      prisma.booking.count({
        where: { status: "CANCELLED", createdAt: { lte: lastMonth } },
      }),
      prisma.booking.count({
        where: { status: "COMPLETED", createdAt: { lte: lastMonth } },
      }),
      prisma.payment.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "COMPLETED",
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: {
                gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                lte: lastMonth,
              },
            },
          },
        },
      }),
    ]);

    // Calculate average session duration
    const sessions = await prisma.booking.aggregate({
      _avg: { totalHours: true },
      where: { status: { in: ["COMPLETED", "CONFIRMED"] } },
    });

    // Calculate completion rate
    const completionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      activeUsers,
      avgSessionDuration: Math.round((sessions._avg.totalHours || 0) * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      bookingGrowth: Math.round(calculateGrowth(totalBookings, lastMonthBookings)),
      confirmedGrowth: Math.round(calculateGrowth(confirmedBookings, lastMonthConfirmed)),
      pendingGrowth: Math.round(calculateGrowth(pendingBookings, lastMonthPending)),
      revenueGrowth: Math.round(
        calculateGrowth(
          totalRevenue._sum.totalAmount || 0,
          lastMonthRevenue._sum.totalAmount || 0
        )
      ),
      activeUserGrowth: Math.round(calculateGrowth(activeUsers, lastMonthActiveUsers)),
      sessionGrowth: 0, // Calculate if needed
      cancellationRate: Math.round(
        calculateGrowth(cancelledBookings, lastMonthCancelled)
      ),
      completionGrowth: 0, // Calculate if needed
    };

    return Response.json(stats);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch booking stats",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
