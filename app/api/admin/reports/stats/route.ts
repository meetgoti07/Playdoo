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
        endpoint: "/api/admin/reports/stats",
      },
      message: "Admin report stats requested",
    });

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Current stats
    const [
      totalReports,
      pendingReports,
      underReviewReports,
      resolvedReports,
      dismissedReports,
      userReports,
      facilityReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.report.count({ where: { status: "RESOLVED" } }),
      prisma.report.count({ where: { status: "DISMISSED" } }),
      prisma.report.count({ where: { reportedUserId: { not: null } } }),
      prisma.report.count({ where: { reportedFacilityId: { not: null } } }),
    ]);

    // Previous month stats for growth calculation
    const [
      lastMonthReports,
      lastMonthPending,
      lastMonthUnderReview,
      lastMonthResolved,
      lastMonthDismissed,
      lastMonthUserReports,
      lastMonthFacilityReports,
    ] = await Promise.all([
      prisma.report.count({
        where: { createdAt: { lte: lastMonth } },
      }),
      prisma.report.count({
        where: { status: "PENDING", createdAt: { lte: lastMonth } },
      }),
      prisma.report.count({
        where: { status: "UNDER_REVIEW", createdAt: { lte: lastMonth } },
      }),
      prisma.report.count({
        where: { status: "RESOLVED", createdAt: { lte: lastMonth } },
      }),
      prisma.report.count({
        where: { status: "DISMISSED", createdAt: { lte: lastMonth } },
      }),
      prisma.report.count({
        where: {
          reportedUserId: { not: null },
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.report.count({
        where: {
          reportedFacilityId: { not: null },
          createdAt: { lte: lastMonth },
        },
      }),
    ]);

    // Calculate average resolution time
    const resolvedReportsWithTime = await prisma.report.findMany({
      where: {
        status: "RESOLVED",
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const avgResolutionTime = resolvedReportsWithTime.length > 0
      ? resolvedReportsWithTime.reduce((sum, report) => {
          const timeDiff = new Date(report.resolvedAt!).getTime() - new Date(report.createdAt).getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / resolvedReportsWithTime.length
      : 0;

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalReports,
      pendingReports,
      underReviewReports,
      resolvedReports,
      dismissedReports,
      userReports,
      facilityReports,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      reportGrowth: Math.round(calculateGrowth(totalReports, lastMonthReports)),
      pendingGrowth: Math.round(calculateGrowth(pendingReports, lastMonthPending)),
      reviewGrowth: Math.round(calculateGrowth(underReviewReports, lastMonthUnderReview)),
      resolvedGrowth: Math.round(calculateGrowth(resolvedReports, lastMonthResolved)),
      dismissedGrowth: Math.round(calculateGrowth(dismissedReports, lastMonthDismissed)),
      userReportGrowth: Math.round(calculateGrowth(userReports, lastMonthUserReports)),
      facilityReportGrowth: Math.round(calculateGrowth(facilityReports, lastMonthFacilityReports)),
      resolutionTimeChange: 0, // Calculate if needed
    };

    return Response.json(stats);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch report stats",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
