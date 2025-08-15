import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { 
  safeToDateString, 
  safeFormatTime, 
  isExpired 
} from "@/lib/utils/dateHelpers";
import { 
  validateBooking,
  createValidationErrorResponse 
} from "@/lib/utils/bookingValidation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { successUrl, cancelUrl } = body;

    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
      },
      message: "Retrying payment for booking.",
    });

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id, // Ensure user can only retry their own bookings
      },
      include: {
        facility: true,
        court: true,
        timeSlot: true,
        payment: true,
        user: true,
      },
    });

    if (!booking) {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
        },
        message: "Booking not found for payment retry.",
      });
      return Response.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Validate booking data
    const bookingValidation = validateBooking(booking);
    if (!bookingValidation.isValid) {
      globalThis?.logger?.error({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          errors: bookingValidation.errors,
        },
        message: "Invalid booking data encountered during payment retry.",
      });
      return createValidationErrorResponse(
        ["Invalid booking data. Please contact support."],
        500
      );
    }

    // Check if booking is still eligible for payment retry
    if (booking.status !== "PENDING") {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          status: booking.status,
        },
        message: "Booking is no longer available for payment retry.",
      });
      return Response.json(
        { error: "Booking is no longer available for payment" },
        { status: 400 }
      );
    }

    // Check if the time slot is still available
    if (booking.timeSlot.isBooked || booking.timeSlot.isBlocked) {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          isBooked: booking.timeSlot.isBooked,
          isBlocked: booking.timeSlot.isBlocked,
        },
        message: "Time slot is no longer available for payment retry.",
      });
      return Response.json(
        { error: "Time slot is no longer available" },
        { status: 400 }
      );
    }

    // Check if booking is not expired (30 minutes from creation)
    if (isExpired(booking.createdAt, 30)) {
      // Mark booking as cancelled and release the time slot
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { 
            status: "CANCELLED",
            cancellationReason: "Payment session expired",
            cancelledAt: new Date(),
          },
        }),
        prisma.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { isBooked: false },
        }),
      ]);

      globalThis?.logger?.info({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
        },
        message: "Booking expired and cancelled automatically.",
      });

      return Response.json(
        { error: "Booking has expired. Please create a new booking." },
        { status: 400 }
      );
    }

    // Check if payment already exists and is not failed
    if (booking.payment && booking.payment.status !== "FAILED") {
      globalThis?.logger?.warn({
        meta: {
          requestId,
          userId: session.user.id,
          bookingId,
          paymentStatus: booking.payment.status,
        },
        message: "Payment is already in progress or completed.",
      });
      return Response.json(
        { error: "Payment is already in progress or completed" },
        { status: 400 }
      );
    }

    // Safely format date and time for display
    const displayDate = safeToDateString(booking.bookingDate);
    const displayStartTime = safeFormatTime(booking.startTime);
    const displayEndTime = safeFormatTime(booking.endTime);

    // Create new Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.user.email,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Court Booking - ${booking.court.name}`,
              description: `${booking.facility.name} - ${displayDate} ${displayStartTime} to ${displayEndTime}`,
              metadata: {
                bookingId: booking.id,
                facilityId: booking.facilityId,
                courtId: booking.courtId,
              },
            },
            unit_amount: Math.round(booking.finalAmount * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        userId: session.user.id,
        type: "booking_payment_retry",
        userEmail: booking.user.email,
        userPhone: booking.user.phone || "",
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    });

    // Update payment record or create new one
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          gatewayOrderId: checkoutSession.id,
          status: "PENDING",
          failureReason: null,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          platformFee: booking.platformFee,
          tax: booking.tax,
          totalAmount: booking.finalAmount,
          paymentMethod: "CREDIT_CARD",
          paymentGateway: "stripe",
          gatewayOrderId: checkoutSession.id,
          status: "PENDING",
        },
      });
    }

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId: booking.id,
        checkoutSessionId: checkoutSession.id,
        amount: booking.finalAmount,
      },
      message: "Payment retry session created successfully.",
    });

    return Response.json({
      bookingId: booking.id,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to retry payment for booking.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}