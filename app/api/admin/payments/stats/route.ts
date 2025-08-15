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
        endpoint: "/api/admin/payments/stats",
      },
      message: "Admin payment stats requested",
    });

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Current stats
    const [
      totalRevenue,
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedAmount,
      platformFee,
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { totalAmount: true },
        where: { status: "COMPLETED" },
      }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "COMPLETED" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.aggregate({
        _sum: { refundAmount: true },
        where: { status: "REFUNDED" },
      }),
      prisma.payment.aggregate({
        _sum: { platformFee: true },
        where: { status: "COMPLETED" },
      }),
    ]);

    // Previous month stats for growth calculation
    const [
      lastMonthRevenue,
      lastMonthPayments,
      lastMonthSuccessful,
      lastMonthFailed,
      lastMonthPending,
      lastMonthRefunded,
      lastMonthPlatformFee,
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "COMPLETED",
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.payment.count({
        where: { createdAt: { lte: lastMonth } },
      }),
      prisma.payment.count({
        where: {
          status: "COMPLETED",
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.payment.count({
        where: {
          status: "FAILED",
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.payment.count({
        where: {
          status: "PENDING",
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.payment.aggregate({
        _sum: { refundAmount: true },
        where: {
          status: "REFUNDED",
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.payment.aggregate({
        _sum: { platformFee: true },
        where: {
          status: "COMPLETED",
          createdAt: { lte: lastMonth },
        },
      }),
    ]);

    // Calculate success rate
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const lastMonthSuccessRate = lastMonthPayments > 0 ? (lastMonthSuccessful / lastMonthPayments) * 100 : 0;

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedAmount: refundedAmount._sum.refundAmount || 0,
      successRate: Math.round(successRate * 10) / 10,
      platformFee: platformFee._sum.platformFee || 0,
      revenueGrowth: Math.round(
        calculateGrowth(
          totalRevenue._sum.totalAmount || 0,
          lastMonthRevenue._sum.totalAmount || 0
        )
      ),
      paymentGrowth: Math.round(calculateGrowth(totalPayments, lastMonthPayments)),
      successGrowth: Math.round(calculateGrowth(successfulPayments, lastMonthSuccessful)),
      failureGrowth: Math.round(calculateGrowth(failedPayments, lastMonthFailed)),
      pendingGrowth: Math.round(calculateGrowth(pendingPayments, lastMonthPending)),
      refundGrowth: Math.round(
        calculateGrowth(
          refundedAmount._sum.refundAmount || 0,
          lastMonthRefunded._sum.refundAmount || 0
        )
      ),
      successRateChange: Math.round((successRate - lastMonthSuccessRate) * 10) / 10,
      platformFeeGrowth: Math.round(
        calculateGrowth(
          platformFee._sum.platformFee || 0,
          lastMonthPlatformFee._sum.platformFee || 0
        )
      ),
    };

    return Response.json(stats);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch payment stats",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
