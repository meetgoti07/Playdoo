import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { safeSyncFacility } from "@/lib/search/facility-sync";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check user role
  if (session.user.role !== "facility_owner") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "fetch_owner_facilities",
      },
      message: "Fetching facilities for owner",
    });

    const userId = session.user.id;

    const facilities = await prisma.facility.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        courts: {
          select: {
            id: true,
            isActive: true,
          },
        },
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
        _count: {
          select: {
            courts: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedFacilities = facilities.map((facility) => ({
      id: facility.id, // Use id (string) for client-side work
      name: facility.name,
      status: facility.status,
      address: facility.address,
      city: facility.city,
      totalCourts: facility._count.courts,
      activeCourts: facility.courts.filter(court => court.isActive).length,
      totalBookings: facility._count.bookings,
      totalReviews: facility._count.reviews,
      rating: facility.rating,
      createdAt: facility.createdAt,
      operatingHours: facility.operatingHours,
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilitiesCount: formattedFacilities.length,
      },
      message: "Owner facilities fetched successfully",
    });

    return Response.json({
      facilities: formattedFacilities,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to fetch owner facilities",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check user role
  if (session.user.role !== "facility_owner") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Extract basic facility data
    const {
      name,
      description,
      address,
      city,
      state,
      country = "India",
      pincode,
      phone,
      email,
      website,
      venueType,
      latitude,
      longitude,
      amenities = [],
      operatingHours = [],
      imageUrls = [],
    } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !pincode || !phone || !venueType) {
      return new Response("Missing required fields", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "create_facility",
        facilityName: name,
        imagesCount: imageUrls.length,
        amenitiesCount: amenities.length,
      },
      message: "Creating new facility with amenities and photos",
    });

    // Create facility with related data
    const facility = await prisma.facility.create({
      data: {
        ownerId: session.user.id,
        name,
        description,
        address,
        city,
        state,
        country,
        pincode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        phone,
        email,
        website,
        venueType,
        status: "PENDING", // Requires admin approval
        
        // Create related records
        amenities: {
          create: amenities.map((amenityId: string) => ({
            amenityId,
          })),
        },
        
        photos: {
          create: imageUrls.map((url: string, index: number) => ({
            url,
            isPrimary: index === 0, // First photo is primary
            sortOrder: index,
          })),
        },
        
        operatingHours: {
          create: operatingHours.map((hour: any) => ({
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          })),
        },
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        photos: true,
        operatingHours: true,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facility.id,
        amenitiesCreated: facility.amenities.length,
        photosCreated: facility.photos.length,
        operatingHoursCreated: facility.operatingHours.length,
      },
      message: "Facility created successfully with all related data",
    });

    // Sync to Elasticsearch (non-blocking)
    // Note: Only approved facilities will be indexed, this will be skipped for now since status is PENDING
    safeSyncFacility(facility.id, 'create');

    return Response.json({
      facility: {
        id: facility.id,
        name: facility.name,
        status: facility.status,
        amenities: facility.amenities.length,
        photos: facility.photos.length,
      },
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session.user.id,
      },
      message: "Failed to create facility",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
