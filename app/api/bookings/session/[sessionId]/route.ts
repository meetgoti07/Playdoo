import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { safeToISOString, safeFormatTime } from "@/lib/utils/dateHelpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { sessionId } = await params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        sessionId,
      },
      message: "Fetching booking details by session ID.",
    });

    // Get Stripe session details
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        sessionId,
        stripeSessionId: stripeSession.id,
        stripeMetadata: stripeSession.metadata,
        paymentStatus: stripeSession.payment_status,
      },
      message: "Retrieved Stripe session details.",
    });

    if (!stripeSession.metadata?.bookingId) {
      globalThis?.logger?.error({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          sessionId,
          stripeMetadata: stripeSession.metadata,
        },
        message: "No booking ID found in Stripe session metadata.",
      });
      return Response.json(
        { error: "Booking not found for this session" },
        { status: 404 }
      );
    }

    // Fetch booking details
    const booking = await prisma.booking.findUnique({
      where: {
        id: stripeSession.metadata.bookingId,
        // Temporarily remove user restriction to debug
        // userId: session.user.id, 
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
          },
        },
        payment: {
          select: {
            status: true,
            paidAt: true,
            transactionId: true,
            gatewayPaymentId: true,
          },
        },
      },
    });

    if (!booking) {
      globalThis?.logger?.error({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          sessionId,
          bookingId: stripeSession.metadata.bookingId,
        },
        message: "Booking not found in database for session.",
      });
      return Response.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if the booking belongs to the current user
    if (booking.userId !== session.user.id) {
      globalThis?.logger?.error({
        meta: {
          requestId: crypto.randomUUID(),
          currentUserId: session.user.id,
          bookingUserId: booking.userId,
          sessionId,
          bookingId: stripeSession.metadata.bookingId,
        },
        message: "User ID mismatch - booking belongs to different user.",
      });
      return Response.json(
        { error: "Unauthorized access to booking" },
        { status: 403 }
      );
    }

    // Format the response
    const bookingData = {
      id: booking.id,
      status: booking.status,
      bookingDate: safeToISOString(booking.bookingDate),
      startTime: safeFormatTime(booking.startTime),
      endTime: safeFormatTime(booking.endTime),
      totalAmount: booking.totalAmount,
      finalAmount: booking.finalAmount,
      specialRequests: booking.specialRequests,
      facility: booking.facility,
      court: booking.court,
      payment: booking.payment,
    };

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: booking.id,
        sessionId,
      },
      message: "Booking details fetched successfully.",
    });

    return Response.json({
      booking: bookingData,
      session: {
        id: stripeSession.id,
        paymentStatus: stripeSession.payment_status,
        paymentIntent: stripeSession.payment_intent,
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch booking details by session ID.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
