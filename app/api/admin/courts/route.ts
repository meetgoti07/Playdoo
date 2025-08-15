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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const sportType = searchParams.get("sportType");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        filters: {
          facilityId,
          sportType,
          isActive,
          search,
          page,
          limit,
        },
      },
      message: "Admin fetching courts.",
    });

    const where: any = {};

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (sportType) {
      where.sportType = sportType;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { facility: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [courts, total] = await Promise.all([
      prisma.court.findMany({
        where,
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
              timeSlots: true,
              maintenance: true,
            },
          },
        },
        orderBy: [
          { facility: { name: "asc" } },
          { name: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.court.count({ where }),
    ]);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtsCount: courts.length,
        total,
        page,
      },
      message: "Admin courts fetched successfully.",
    });

    return Response.json({
      courts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin courts.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
