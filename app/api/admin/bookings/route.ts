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
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "";

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        page,
        limit,
        status,
        search,
        dateRange,
      },
      message: "Admin bookings list requested",
    });

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { facility: { name: { contains: search, mode: "insensitive" } } },
        { id: { contains: search, mode: "insensitive" } }, // Search by id (string) instead of hashId
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
        case "tomorrow":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "this_week":
          const firstDay = now.getDate() - now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), firstDay);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "next_week":
          const nextWeekStart = now.getDate() - now.getDay() + 7;
          startDate = new Date(now.getFullYear(), now.getMonth(), nextWeekStart);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "next_month":
          startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
          break;
        case "past_week":
          const pastWeekEnd = now.getDate() - now.getDay();
          endDate = new Date(now.getFullYear(), now.getMonth(), pastWeekEnd);
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "past_month":
          endDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        default:
          startDate = endDate = now;
      }

      if (startDate && endDate) {
        where.bookingDate = {
          gte: startDate,
          lt: endDate,
        };
      }
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
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
              sportType: true,
            },
          },
          payment: {
            select: {
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const formattedBookings = bookings.map(booking => ({
      id: booking.id, // Use id (string) for client-side work
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      finalAmount: booking.finalAmount,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: booking.user,
      facility: booking.facility,
      court: booking.court,
      payment: booking.payment,
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingsCount: formattedBookings.length,
        totalCount,
        filters: { status, search, dateRange },
      },
      message: "Admin bookings list fetched successfully",
    });

    const response = {
      bookings: formattedBookings,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };

    return Response.json(response);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin bookings",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
