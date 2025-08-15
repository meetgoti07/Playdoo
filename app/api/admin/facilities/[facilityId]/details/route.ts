import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET(
  request: Request,
  { params }: { params: { facilityId: string } }
) {
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

    const { facilityId } = params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        adminId: session.user.id,
        facilityId,
      },
      message: "Admin fetching facility details",
    });

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        courts: {
          select: {
            id: true,
            name: true,
            sportType: true,
            isActive: true,
            pricePerHour: true,
          },
        },
        amenities: {
          select: {
            id: true,
            amenity: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
            isPrimary: true,
            sortOrder: true,
          },
        },
        operatingHours: {
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!facility) {
      return new Response("Facility not found", { status: 404 });
    }

    // Format the response
    const facilityDetails = {
      id: facility.id,
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
      status: facility.status,
      venueType: facility.venueType,
      rating: facility.rating,
      totalReviews: facility.totalReviews,
      isActive: facility.isActive,
      approvedAt: facility.approvedAt?.toISOString(),
      rejectedAt: facility.rejectedAt?.toISOString(),
      rejectionReason: facility.rejectionReason,
      createdAt: facility.createdAt.toISOString(),
      updatedAt: facility.updatedAt.toISOString(),
      owner: facility.owner,
      courts: facility.courts,
      amenities: facility.amenities.map(fa => ({
        id: fa.amenity.id,
        name: fa.amenity.name,
        icon: fa.amenity.icon,
      })),
      photos: facility.photos,
      operatingHours: facility.operatingHours.map(hour => ({
        ...hour,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
      _count: facility._count,
    };

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        adminId: session.user.id,
        facilityId,
        facilityName: facility.name,
        status: facility.status,
      },
      message: "Facility details fetched successfully",
    });

    return Response.json(facilityDetails);

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch facility details",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
