import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
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
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "7d";

    let days = 7;
    switch (period) {
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 7;
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "fetch_revenue_analytics",
        period,
      },
      message: "Fetching revenue analytics for facility owner",
    });

    const userId = session.user.id;
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Create array of dates for the period
    const dateArray = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, i);
      dateArray.unshift(format(date, "yyyy-MM-dd"));
    }

    // Get revenue data for each day
    const revenueData = await Promise.all(
      dateArray.map(async (date) => {
        const dayStart = startOfDay(new Date(date));
        const dayEnd = endOfDay(new Date(date));

        const [bookings, revenue] = await Promise.all([
          prisma.booking.count({
            where: {
              facility: {
                ownerId: userId,
              },
              createdAt: {
                gte: dayStart,
                lte: dayEnd,
              },
              status: {
                in: ["CONFIRMED", "COMPLETED"],
              },
            },
          }),
          prisma.booking.aggregate({
            where: {
              facility: {
                ownerId: userId,
              },
              createdAt: {
                gte: dayStart,
                lte: dayEnd,
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

        return {
          date,
          revenue: revenue._sum.finalAmount || 0,
          bookings,
        };
      })
    );

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        period,
        dataPoints: revenueData.length,
      },
      message: "Revenue analytics fetched successfully",
    });

    return Response.json({
      data: revenueData,
      period,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to fetch revenue analytics",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
