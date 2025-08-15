import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { z } from "zod";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";

const revenueQuerySchema = z.object({
  period: z.enum(["month", "year", "custom"]).optional().default("month"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  facilityId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = revenueQuerySchema.parse({
      period: searchParams.get("period") || "month",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
    });

    // Get owner's facilities
    const ownerFacilities = await prisma.facility.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });

    const facilityIds = validatedQuery.facilityId 
      ? [validatedQuery.facilityId]
      : ownerFacilities.map(f => f.id);

    if (facilityIds.length === 0) {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          action: "get_revenue",
        },
        message: "Owner has no facilities",
      });

      return Response.json({
        totalRevenue: 0,
        revenueGrowth: 0,
        monthlyRevenue: [],
        facilityRevenue: [],
        recentTransactions: [],
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date;

    switch (validatedQuery.period) {
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        previousEndDate = endOfYear(subYears(now, 1));
        break;
      case "custom":
        if (!validatedQuery.startDate || !validatedQuery.endDate) {
          return new Response("Start date and end date required for custom period", { status: 400 });
        }
        startDate = new Date(validatedQuery.startDate);
        endDate = new Date(validatedQuery.endDate);
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        previousStartDate = new Date(startDate.getTime() - diffDays * 24 * 60 * 60 * 1000);
        previousEndDate = new Date(endDate.getTime() - diffDays * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
    }

    // Get current period revenue
    const currentRevenue = await prisma.payment.aggregate({
      where: {
        booking: {
          facilityId: { in: facilityIds },
        },
        status: "COMPLETED",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get previous period revenue for growth calculation
    const previousRevenue = await prisma.payment.aggregate({
      where: {
        booking: {
          facilityId: { in: facilityIds },
        },
        status: "COMPLETED",
        paidAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Calculate growth percentage
    const currentTotal = currentRevenue._sum.totalAmount || 0;
    const previousTotal = previousRevenue._sum.totalAmount || 0;
    const revenueGrowth = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;

    // Get monthly revenue for the last 12 months
    const monthlyRevenue = await getMonthlyRevenue(facilityIds);

    // Get revenue by facility (removed problematic groupBy)

    // Get facility details for revenue data
    const facilityRevenueData = await Promise.all(
      ownerFacilities.map(async (facility) => {
        const revenue = await prisma.payment.aggregate({
          where: {
            booking: {
              facilityId: facility.id,
            },
            status: "COMPLETED",
            paidAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        return {
          facilityId: facility.id,
          facilityName: facility.name,
          revenue: revenue._sum.totalAmount || 0,
          transactions: revenue._count.id,
        };
      })
    );

    // Get recent transactions
    const recentTransactions = await prisma.payment.findMany({
      where: {
        booking: {
          facilityId: { in: facilityIds },
        },
        status: "COMPLETED",
      },
      include: {
        booking: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            facility: {
              select: { name: true },
            },
            court: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 10,
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "get_revenue",
        period: validatedQuery.period,
        totalRevenue: currentTotal,
      },
      message: "Successfully retrieved revenue data",
    });

    return Response.json({
      totalRevenue: currentTotal,
      revenueGrowth,
      monthlyRevenue,
      facilityRevenue: facilityRevenueData,
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.totalAmount,
        paidAt: transaction.paidAt,
        customer: transaction.booking.user.name,
        facility: transaction.booking.facility.name,
        court: transaction.booking.court.name,
        paymentMethod: transaction.paymentMethod,
      })),
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch revenue data",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

async function getMonthlyRevenue(facilityIds: string[]) {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const revenue = await prisma.payment.aggregate({
      where: {
        booking: {
          facilityId: { in: facilityIds },
        },
        status: "COMPLETED",
        paidAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    months.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: revenue._sum.totalAmount || 0,
    });
  }
  
  return months;
}
