import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { startOfMonth, startOfDay, subMonths } from "date-fns";

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
        action: "fetch_owner_dashboard_stats",
      },
      message: "Fetching owner dashboard statistics",
    });

    const userId = session.user.id;
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());
    const lastMonth = startOfMonth(subMonths(new Date(), 1));

    // Get total facilities count
    const totalFacilities = await prisma.facility.count({
      where: {
        ownerId: userId,
      },
    });

    // Get total courts count
    const totalCourts = await prisma.court.count({
      where: {
        facility: {
          ownerId: userId,
        },
      },
    });

    // Get today's bookings count
    const todayBookings = await prisma.booking.count({
      where: {
        facility: {
          ownerId: userId,
        },
        bookingDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get this month's revenue
    const thisMonthRevenue = await prisma.booking.aggregate({
      where: {
        facility: {
          ownerId: userId,
        },
        createdAt: {
          gte: thisMonth,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      _sum: {
        finalAmount: true,
      },
    });

    // Get last month's revenue for growth calculation
    const lastMonthRevenue = await prisma.booking.aggregate({
      where: {
        facility: {
          ownerId: userId,
        },
        createdAt: {
          gte: lastMonth,
          lt: thisMonth,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      _sum: {
        finalAmount: true,
      },
    });

    // Get total unique customers
    const totalCustomers = await prisma.booking.findMany({
      where: {
        facility: {
          ownerId: userId,
        },
      },
      distinct: ["userId"],
      select: {
        userId: true,
      },
    });

    // Calculate growth percentage
    const currentRevenue = thisMonthRevenue._sum.finalAmount || 0;
    const previousRevenue = lastMonthRevenue._sum.finalAmount || 0;
    const growthPercentage = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const stats = {
      totalFacilities,
      totalCourts,
      todayBookings,
      monthlyRevenue: currentRevenue,
      totalCustomers: totalCustomers.length,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
    };

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        stats,
      },
      message: "Owner dashboard statistics fetched successfully",
    });

    return Response.json(stats);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to fetch owner dashboard statistics",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
