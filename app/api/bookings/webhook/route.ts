import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET! 
      );
    } catch (err) {
      globalThis?.logger?.error({
        err,
        message: "Webhook signature verification failed.",
      });
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        eventType: event.type,
        eventId: event.id,
      },
      message: "Processing Stripe webhook event.",
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.type === "booking_payment" || session.metadata?.type === "booking_payment_retry") {
          await handleBookingPaymentSuccess(session);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.type === "booking_payment" || session.metadata?.type === "booking_payment_retry") {
          await handleBookingPaymentExpired(session);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        globalThis?.logger?.info({
          meta: {
            requestId: crypto.randomUUID(),
            eventType: event.type,
          },
          message: "Unhandled webhook event type.",
        });
    }

    return Response.json({ received: true });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to process webhook.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function handleBookingPaymentSuccess(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  
  if (!bookingId) {
    throw new Error("Missing booking ID in session metadata");
  }

  await prisma.$transaction(async (tx) => {
    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // Update payment status
    await tx.payment.update({
      where: { bookingId },
      data: {
        status: "COMPLETED",
        gatewayPaymentId: session.payment_intent as string,
        paidAt: new Date(),
      },
    });

    // Mark time slot as booked
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { timeSlot: true },
    });

    if (booking) {
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { isBooked: true },
      });
    }
  });

  globalThis?.logger?.info({
    meta: {
      requestId: crypto.randomUUID(),
      bookingId,
      sessionId: session.id,
    },
    message: "Booking payment confirmed successfully.",
  });
}

async function handleBookingPaymentExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  
  if (!bookingId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Payment session expired",
      },
    });

    // Update payment status
    await tx.payment.update({
      where: { bookingId },
      data: {
        status: "CANCELLED",
        failureReason: "Payment session expired",
      },
    });
  });

  globalThis?.logger?.info({
    meta: {
      requestId: crypto.randomUUID(),
      bookingId,
      sessionId: session.id,
    },
    message: "Booking cancelled due to expired payment session.",
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find payment by gateway payment ID
  const payment = await prisma.payment.findFirst({
    where: { gatewayPaymentId: paymentIntent.id },
    include: { booking: true },
  });

  if (!payment) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
      },
    });

    // Update booking status
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Payment failed",
      },
    });
  });

  globalThis?.logger?.info({
    meta: {
      requestId: crypto.randomUUID(),
      bookingId: payment.bookingId,
      paymentIntentId: paymentIntent.id,
    },
    message: "Booking cancelled due to payment failure.",
  });
}
