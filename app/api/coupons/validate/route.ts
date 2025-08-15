import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { code, totalAmount } = body;

    if (!code || !totalAmount) {
      return Response.json(
        { error: "Coupon code and total amount are required" },
        { status: 400 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        couponCode: code,
        totalAmount,
      },
      message: "Validating coupon code.",
    });

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    });

    if (!coupon) {
      return Response.json(
        { error: "Invalid or expired coupon code" },
        { status: 400 }
      );
    }

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

    // Check user usage limit (if applicable)
    if (coupon.userUsageLimit) {
      const userUsageCount = await prisma.bookingCoupon.count({
        where: {
          couponId: coupon.id,
          booking: {
            userId: session.user.id,
          },
        },
      });

      if (userUsageCount >= coupon.userUsageLimit) {
        return Response.json(
          { error: "You have exceeded the usage limit for this coupon" },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = totalAmount * (coupon.discountValue / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    // Apply maximum discount limit
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        couponId: coupon.id,
        originalAmount: totalAmount,
        discountAmount,
        finalAmount,
      },
      message: "Coupon validated successfully.",
    });

    return Response.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: {
        amount: discountAmount,
        percentage: coupon.discountType === "PERCENTAGE" ? coupon.discountValue : (discountAmount / totalAmount) * 100,
      },
      finalAmount,
      savings: discountAmount,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to validate coupon.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
