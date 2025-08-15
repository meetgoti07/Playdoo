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
    const city = searchParams.get("city");
    const sportType = searchParams.get("sportType");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        filters: { city, sportType, search },
        pagination: { page, limit },
      },
      message: "Fetching facilities for booking.",
    });

    const where: any = {
      status: "APPROVED",
      isActive: true,
    };

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (sportType) {
      where.courts = {
        some: {
          sportType: sportType,
          isActive: true,
        },
      };
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip,
        take: limit,
        include: {
          courts: {
            where: {
              isActive: true,
              ...(sportType && { sportType }),
            },
            select: {
              id: true,
              name: true,
              sportType: true,
              pricePerHour: true,
              surface: true,
              capacity: true,
            },
          },
          photos: {
            where: { isPrimary: true },
            select: {
              url: true,
              caption: true,
            },
            take: 1,
          },
          amenities: {
            include: {
              amenity: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
          operatingHours: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: [
          { rating: "desc" },
          { totalReviews: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.facility.count({ where }),
    ]);

    const facilitiesWithMinPrice = facilities.map((facility) => ({
      ...facility,
      minPrice: facility.courts.length > 0 
        ? Math.min(...facility.courts.map(court => court.pricePerHour))
        : 0,
      availableSports: [...new Set(facility.courts.map(court => court.sportType))],
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        totalFacilities: total,
        returnedFacilities: facilities.length,
      },
      message: "Facilities fetched successfully.",
    });

    return Response.json({
      facilities: facilitiesWithMinPrice,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + facilities.length < total,
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch facilities.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
