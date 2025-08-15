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

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        filters: { isActive, search, page, limit },
      },
      message: "Admin coupons list requested",
    });

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              bookingCoupons: true,
            },
          },
        },
      }),
      prisma.coupon.count({ where }),
    ]);

    return Response.json({
      coupons,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch coupons",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableSports,
    } = body;

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      return new Response("Coupon code already exists", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        couponCode: code,
      },
      message: "Admin creating new coupon",
    });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minBookingAmount: minBookingAmount ? parseFloat(minBookingAmount) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        userUsageLimit: userUsageLimit ? parseInt(userUsageLimit) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicableSports: JSON.stringify(applicableSports || []),
        isActive: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_COUPON",
        entity: "coupon",
        entityId: coupon.id,
        newData: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
      },
    });

    return Response.json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to create coupon",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
