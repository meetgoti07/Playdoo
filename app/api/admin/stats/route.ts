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
        endpoint: "/api/admin/stats",
      },
      message: "Admin stats requested",
    });

    // Get current stats
    const [
      totalUsers,
      totalFacilities,
      activeBookings,
      activeCourts,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.facility.count({
        where: { status: "APPROVED", isActive: true },
      }),
      prisma.booking.count({
        where: {
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      }),
      prisma.court.count({
        where: { isActive: true },
      }),
      prisma.payment.aggregate({
        _sum: { totalAmount: true },
        where: { status: "COMPLETED" },
      }),
    ]);

    // Get previous month stats for growth calculation
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      lastMonthUsers,
      lastMonthFacilities,
      lastMonthBookings,
      lastMonthCourts,
      lastMonthRevenue,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lte: lastMonth } },
      }),
      prisma.facility.count({
        where: {
          status: "APPROVED",
          isActive: true,
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.court.count({
        where: {
          isActive: true,
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.payment.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "COMPLETED",
          createdAt: { lte: lastMonth },
        },
      }),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalUsers,
      totalFacilities,
      activeBookings,
      activeCourts,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      userGrowth: Math.round(calculateGrowth(totalUsers, lastMonthUsers)),
      facilityGrowth: Math.round(calculateGrowth(totalFacilities, lastMonthFacilities)),
      bookingGrowth: Math.round(calculateGrowth(activeBookings, lastMonthBookings)),
      courtGrowth: Math.round(calculateGrowth(activeCourts, lastMonthCourts)),
      revenueGrowth: Math.round(
        calculateGrowth(
          totalRevenue._sum.totalAmount || 0,
          lastMonthRevenue._sum.totalAmount || 0
        )
      ),
    };

    return Response.json(stats);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin stats",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
