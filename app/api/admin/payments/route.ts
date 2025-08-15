import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "";

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        page,
        limit,
        status,
        method,
        search,
        dateRange,
      },
      message: "Admin payments list requested",
    });

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (method) {
      where.paymentMethod = method;
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: "insensitive" } },
        { gatewayPaymentId: { contains: search, mode: "insensitive" } },
        { booking: { user: { name: { contains: search, mode: "insensitive" } } } },
        { booking: { user: { email: { contains: search, mode: "insensitive" } } } },
        { hashId: { equals: parseInt(search) || undefined } },
      ];
    }

    // Handle date range filtering
    if (dateRange) {
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "yesterday":
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "this_week":
          const firstDay = now.getDate() - now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), firstDay);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "last_week":
          const lastWeekEnd = now.getDate() - now.getDay();
          endDate = new Date(now.getFullYear(), now.getMonth(), lastWeekEnd);
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "last_month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "this_quarter":
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          endDate = new Date(now.getFullYear(), quarterStart + 3, 1);
          break;
        case "last_quarter":
          const lastQuarterStart = Math.floor(now.getMonth() / 3) * 3 - 3;
          startDate = new Date(now.getFullYear(), lastQuarterStart, 1);
          endDate = new Date(now.getFullYear(), lastQuarterStart + 3, 1);
          break;
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          startDate = endDate = now;
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lt: endDate,
        };
      }
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
              facility: {
                select: {
                  name: true,
                },
              },
              court: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const response = {
      payments,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };

    return Response.json(response);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin payments",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
