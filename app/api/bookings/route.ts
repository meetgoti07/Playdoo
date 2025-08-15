import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        status,
        page,
        limit,
      },
      message: "Fetching user bookings.",
    });

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    // Get total count
    const totalBookings = await prisma.booking.count({ where });

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            rating: true,
            totalReviews: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            surface: true,
            capacity: true,
          },
        },
        payment: {
          select: {
            status: true,
            paidAt: true,
            transactionId: true,
            gatewayOrderId: true,
            paymentMethod: true,
          },
        },
        bookingCoupons: {
          include: {
            coupon: {
              select: {
                code: true,
                name: true,
                discountType: true,
                discountValue: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalBookings / limit);
    const hasMore = page < totalPages;

    // Format the response
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      bookingDate: booking.bookingDate ? booking.bookingDate.toISOString().split('T')[0] : null,
      startTime: booking.startTime ? booking.startTime.toISOString().split('T')[1]?.split('.')[0] : null,
      endTime: booking.endTime ? booking.endTime.toISOString().split('T')[1]?.split('.')[0] : null,
      totalHours: booking.totalHours,
      pricePerHour: booking.pricePerHour,
      totalAmount: booking.totalAmount,
      platformFee: booking.platformFee,
      tax: booking.tax,
      finalAmount: booking.finalAmount,
      specialRequests: booking.specialRequests,
      confirmedAt: booking.confirmedAt?.toISOString(),
      cancelledAt: booking.cancelledAt?.toISOString(),
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt.toISOString(),
      facility: booking.facility,
      court: booking.court,
      payment: booking.payment ? {
        ...booking.payment,
        paidAt: booking.payment.paidAt?.toISOString(),
      } : null,
      coupons: booking.bookingCoupons.map((bc) => ({
        discountAmount: bc.discountAmount,
        coupon: bc.coupon,
      })),
    }));

    // Get booking counts by status for the sidebar
    const statusCounts = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        userId: session.user.id,
      },
      _count: {
        status: true,
      },
    });

    const counts = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        totalBookings,
        returnedBookings: formattedBookings.length,
      },
      message: "User bookings fetched successfully.",
    });

    return Response.json({
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        total: totalBookings,
        totalPages,
        hasMore,
      },
      statusCounts: {
        all: totalBookings,
        ...counts,
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch user bookings.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
