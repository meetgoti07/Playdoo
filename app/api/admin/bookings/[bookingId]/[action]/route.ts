import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function POST(
  request: Request,
  { params }: { params: { bookingId: string; action: string } }
) {
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

    const { bookingId, action } = params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId,
        action,
      },
      message: `Admin booking action: ${action}`,
    });

    // Find booking by id
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        facility: true,
        court: true,
        timeSlot: true,
      },
    });

    if (!booking) {
      return new Response("Booking not found", { status: 404 });
    }

    let updatedBooking;

    switch (action) {
      case "confirm":
        if (booking.status !== "PENDING") {
          return new Response("Booking cannot be confirmed", { status: 400 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
        });

        // Update time slot
        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { isBooked: true },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BOOKING_CONFIRMED",
            entity: "booking",
            entityId: booking.id,
            newData: { status: "CONFIRMED" },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      case "cancel":
        if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
          return new Response("Booking cannot be cancelled", { status: 400 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: "Cancelled by admin",
          },
        });

        // Free up the time slot
        await prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { isBooked: false },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BOOKING_CANCELLED",
            entity: "booking",
            entityId: booking.id,
            newData: { status: "CANCELLED", cancellationReason: "Cancelled by admin" },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      case "complete":
        if (booking.status !== "CONFIRMED") {
          return new Response("Booking cannot be completed", { status: 400 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BOOKING_COMPLETED",
            entity: "booking",
            entityId: booking.id,
            newData: { status: "COMPLETED" },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      case "no-show":
        if (booking.status !== "CONFIRMED") {
          return new Response("Booking cannot be marked as no-show", { status: 400 });
        }
        updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "NO_SHOW",
            noShowAt: new Date(),
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BOOKING_NO_SHOW",
            entity: "booking",
            entityId: booking.id,
            newData: { status: "NO_SHOW" },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      default:
        return new Response("Invalid action", { status: 400 });
    }

    return Response.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to perform booking action",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
