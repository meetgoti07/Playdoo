import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { NextRequest } from "next/server";
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check user role
    if (session.user.role !== "ADMIN") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    let from: Date;
    let to: Date = new Date();

    if (startDate && endDate) {
      from = new Date(startDate);
      to = new Date(endDate);
    } else {
      switch (period) {
        case "7d":
          from = subDays(to, 7);
          break;
        case "30d":
          from = subDays(to, 30);
          break;
        case "90d":
          from = subDays(to, 90);
          break;
        case "1y":
          from = subYears(to, 1);
          break;
        default:
          from = subDays(to, 30);
      }
    }

    // Get previous period for comparison
    const previousPeriodStart = new Date(from);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (to.getTime() - from.getTime()));

    // Fetch current period data
    const [
      totalUsers,
      totalFacilities,
      totalBookings,
      totalRevenue,
      previousUsers,
      previousBookings,
      previousRevenue,
    ] = await Promise.all([
      // Current totals
      prisma.user.count({
        where: {
          createdAt: { gte: startOfDay(from), lte: endOfDay(to) }
        }
      }),
      prisma.facility.count({
        where: {
          createdAt: { gte: startOfDay(from), lte: endOfDay(to) },
          status: "APPROVED"
        }
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfDay(from), lte: endOfDay(to) }
        }
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: startOfDay(from), lte: endOfDay(to) },
          status: "COMPLETED"
        },
        _sum: { totalAmount: true }
      }),
      
      // Previous period for comparison
      prisma.user.count({
        where: {
          createdAt: { gte: startOfDay(previousPeriodStart), lte: endOfDay(from) }
        }
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfDay(previousPeriodStart), lte: endOfDay(from) }
        }
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: startOfDay(previousPeriodStart), lte: endOfDay(from) },
          status: "COMPLETED"
        },
        _sum: { totalAmount: true }
      }),
    ]);

    // Calculate growth percentages
    const userGrowth = previousUsers > 0 ? ((totalUsers - previousUsers) / previousUsers) * 100 : 0;
    const bookingGrowth = previousBookings > 0 ? ((totalBookings - previousBookings) / previousBookings) * 100 : 0;
    const revenueGrowth = (previousRevenue._sum.totalAmount || 0) > 0 
      ? (((totalRevenue._sum.totalAmount || 0) - (previousRevenue._sum.totalAmount || 0)) / (previousRevenue._sum.totalAmount || 0)) * 100 
      : 0;

    // Get additional data
    const [usersByType, bookingsByStatus, facilityTypes, topCities] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true }
      }),
      prisma.booking.groupBy({
        by: ["status"],
        _count: { id: true }
      }),
      prisma.facility.groupBy({
        by: ["type"],
        _count: { id: true }
      }),
      prisma.facility.groupBy({
        by: ["city"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      }),
    ]);

    // Sample data for charts (in production, this would be real data)
    const analytics = {
      overview: {
        totalUsers,
        totalFacilities,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        userGrowth: Math.round(userGrowth * 100) / 100,
        facilityGrowth: 0,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      userStats: [],
      bookingStats: [],
      revenueStats: [],
      facilityStats: [],
      topCities: topCities.map(city => ({
        id: city.city,
        name: city.city,
        location: city.city,
        bookings: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 10000) + 5000,
      })),
      recentActivities: [
        {
          id: "1",
          description: "New facility approved",
          user: "Admin",
          timestamp: new Date().toISOString(),
          type: "success"
        },
        {
          id: "2", 
          description: "User registered",
          user: "System",
          timestamp: new Date().toISOString(),
          type: "info"
        }
      ],
      charts: {
        timeline: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          users: Math.floor(Math.random() * 50) + 10,
          bookings: Math.floor(Math.random() * 30) + 5
        })),
        userGrowth: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          users: Math.floor(Math.random() * 50) + 10
        })),
        userTypes: usersByType.map(type => ({
          name: type.role,
          value: type._count.id
        })),
        bookingTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bookings: Math.floor(Math.random() * 30) + 5
        })),
        bookingStatus: bookingsByStatus.map(status => ({
          name: status.status,
          value: status._count.id
        })),
        revenue: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 5000) + 1000
        })),
        revenueSources: [
          { name: "Bookings", value: totalRevenue._sum.totalAmount || 0 },
          { name: "Membership", value: Math.floor(Math.random() * 10000) },
          { name: "Equipment", value: Math.floor(Math.random() * 5000) }
        ],
        facilityPerformance: [],
        facilityTypes: facilityTypes.map(type => ({
          name: type.type || "Unknown",
          value: type._count.id
        }))
      }
    };

    return Response.json(analytics);
  } catch (error) {
    console.error("Analytics API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
