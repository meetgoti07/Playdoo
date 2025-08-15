import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { 
  safeCreateDateTime, 
  safeCalculateHours, 
  safeFormatTime,
  safeToDate 
} from "@/lib/utils/dateHelpers";
import { 
  validateBookingCreationInput, 
  validateTimeSlot,
  createValidationErrorResponse 
} from "@/lib/utils/bookingValidation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    
    // Validate input data
    const inputValidation = validateBookingCreationInput(body);
    if (!inputValidation.isValid) {
      globalThis?.logger?.warn({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          errors: inputValidation.errors,
        },
        message: "Invalid booking creation input.",
      });
      return createValidationErrorResponse(inputValidation.errors);
    }

    const {
      facilityId,
      courtId,
      timeSlotId,
      specialRequests,
      couponCode,
      userDetails,
      successUrl,
      cancelUrl,
    } = inputValidation.sanitizedInput!;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId,
        courtId,
        timeSlotId,
      },
      message: "Creating booking request.",
    });

    // Validate the time slot
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        court: {
          include: {
            facility: true,
          },
        },
      },
    });

    if (!timeSlot) {
      return Response.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    if (timeSlot.isBooked || timeSlot.isBlocked) {
      return Response.json(
        { error: "Time slot is not available" },
        { status: 400 }
      );
    }

    // Validate time slot data
    const timeSlotValidation = validateTimeSlot(timeSlot);
    if (!timeSlotValidation.isValid) {
      globalThis?.logger?.error({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          timeSlotId,
          errors: timeSlotValidation.errors,
        },
        message: "Invalid time slot data encountered.",
      });
      return createValidationErrorResponse(
        ["Invalid time slot data. Please try a different slot."],
        500
      );
    }

    // Calculate pricing
    const pricePerHour = timeSlot.price || timeSlot.court.pricePerHour;
    
    // Safely calculate total hours using helper function
    const startDateTime = safeCreateDateTime(timeSlot.date, timeSlot.startTime);
    const endDateTime = safeCreateDateTime(timeSlot.date, timeSlot.endTime);
    
    if (!startDateTime || !endDateTime) {
      globalThis?.logger?.error({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          timeSlotId,
          date: timeSlot.date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
        },
        message: "Invalid date/time values in time slot.",
      });
      return Response.json(
        { error: "Invalid time slot data. Please try again." },
        { status: 400 }
      );
    }
    
    const totalHours = safeCalculateHours(startDateTime, endDateTime);
    
    if (totalHours <= 0) {
      globalThis?.logger?.error({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          timeSlotId,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          totalHours,
        },
        message: "Invalid time slot duration calculated.",
      });
      return Response.json(
        { error: "Invalid time slot duration. Please contact support." },
        { status: 400 }
      );
    }
    
    const totalAmount = pricePerHour * totalHours;
    const platformFee = totalAmount * 0.03; // 3% platform fee
    const tax = (totalAmount + platformFee) * 0.18; // 18% GST
    let finalAmount = totalAmount + platformFee + tax;
    let discountAmount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (coupon) {
        // Check usage limits
        if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
          return Response.json(
            { error: "Coupon usage limit exceeded" },
            { status: 400 }
          );
        }

        // Check minimum booking amount
        if (coupon.minBookingAmount && totalAmount < coupon.minBookingAmount) {
          return Response.json(
            { error: `Minimum booking amount of ₹${coupon.minBookingAmount} required` },
            { status: 400 }
          );
        }

        // Calculate discount
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = totalAmount * (coupon.discountValue / 100);
        } else {
          discountAmount = coupon.discountValue;
        }

        // Apply maximum discount limit
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }

        finalAmount -= discountAmount;
      }
    }

    // Update or create user profile with booking details
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: userDetails.fullName,
        email: userDetails.email,
        phone: userDetails.phone,
        userProfile: {
          upsert: {
            create: {
              fullName: userDetails.fullName,
              emergencyContact: userDetails.emergencyContact || null,
              emergencyPhone: userDetails.emergencyPhone || null,
            },
            update: {
              fullName: userDetails.fullName,
              emergencyContact: userDetails.emergencyContact || null,
              emergencyPhone: userDetails.emergencyPhone || null,
            },
          },
        },
      },
    });

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        facilityId,
        courtId,
        timeSlotId,
        bookingDate: timeSlot.date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        totalHours,
        pricePerHour,
        totalAmount,
        platformFee,
        tax,
        finalAmount,
        specialRequests,
        status: "PENDING",
      },
    });

    // Apply coupon to booking if used
    if (couponCode && discountAmount > 0) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode },
      });

      if (coupon) {
        await prisma.bookingCoupon.create({
          data: {
            bookingId: booking.id,
            couponId: coupon.id,
            discountAmount,
          },
        });

        // Update coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { currentUsage: { increment: 1 } },
        });
      }
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: session.user.stripeCustomerId || undefined,
      customer_email: !session.user.stripeCustomerId ? userDetails.email : undefined,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Court Booking - ${timeSlot.court.name}`,
              description: `${timeSlot.court.facility.name} - ${safeToDate(timeSlot.date)?.toDateString() || 'Invalid Date'} ${safeFormatTime(timeSlot.startTime)} to ${safeFormatTime(timeSlot.endTime)}`,
              metadata: {
                bookingId: booking.id,
                facilityId,
                courtId,
              },
            },
            unit_amount: Math.round(finalAmount * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        userId: session.user.id,
        type: "booking_payment",
        userEmail: userDetails.email,
        userPhone: userDetails.phone,
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        platformFee,
        tax,
        totalAmount: finalAmount,
        paymentMethod: "CREDIT_CARD", // Default for card payments
        paymentGateway: "stripe",
        gatewayOrderId: checkoutSession.id,
        status: "PENDING",
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        bookingId: booking.id,
        checkoutSessionId: checkoutSession.id,
      },
      message: "Booking created and checkout session generated.",
    });

    return Response.json({
      bookingId: booking.id,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to create booking.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
