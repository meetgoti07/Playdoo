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

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "fetch_admin_facilities",
      },
      message: "Admin fetching facilities list",
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [facilities, totalCount] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
          photos: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              courts: true,
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.facility.count({ where }),
    ]);

    const formattedFacilities = facilities.map(facility => ({
      id: facility.id, // Use id (string) for client-side work
      name: facility.name,
      description: facility.description,
      address: facility.address,
      city: facility.city,
      state: facility.state,
      country: facility.country,
      pincode: facility.pincode,
      latitude: facility.latitude,
      longitude: facility.longitude,
      phone: facility.phone,
      email: facility.email,
      website: facility.website,
      venueType: facility.venueType,
      status: facility.status,
      rating: facility.rating,
      isActive: facility.isActive,
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt,
      owner: facility.owner,
      photos: facility.photos,
      _count: facility._count,
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilitiesCount: formattedFacilities.length,
        totalCount,
        filters: { status, city, search },
      },
      message: "Admin facilities list fetched successfully",
    });

    return Response.json({
      facilities: formattedFacilities,
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
      message: "Failed to fetch admin facilities",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
