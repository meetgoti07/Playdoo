import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

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
        action: "fetch_recent_bookings",
      },
      message: "Fetching recent bookings for facility owner",
    });

    const userId = session.user.id;

    const bookings = await prisma.booking.findMany({
      where: {
        facility: {
          ownerId: userId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        facility: {
          select: {
            name: true,
            id: true, // Get id (string) instead of hashId
          },
        },
        court: {
          select: {
            name: true,
            sportType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id, // Use id (string) for client-side work
      bookingDate: booking.bookingDate.toISOString().split('T')[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      user: booking.user,
      facility: {
        ...booking.facility,
        id: booking.facility.id, // Use facility id (string) for client-side work
      },
      court: booking.court,
      finalAmount: booking.finalAmount,
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingsCount: formattedBookings.length,
      },
      message: "Recent bookings fetched successfully",
    });

    return Response.json({
      bookings: formattedBookings,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to fetch recent bookings",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
