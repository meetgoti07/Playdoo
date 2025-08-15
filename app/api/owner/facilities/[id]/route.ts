import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { z } from 'zod';
import { safeSyncFacility } from '@/lib/search/facility-sync';

const facilityUpdateSchema = z.object({
  name: z.string().min(1, "Facility name is required").max(100),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required").max(255),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().min(1, "Pincode is required").max(10),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  venueType: z.enum(["INDOOR", "OUTDOOR", "BOTH"]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check user role
    if (session.user.role !== "facility_owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const { id: facilityId } = await params;

    console.log("GET /api/owner/facilities/[id] - Debug Info:");
    console.log("- Facility ID:", facilityId);
    console.log("- User ID:", session.user.id);
    console.log("- User Role:", session.user.role);

    const facility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        ownerId: session.user.id, // Ensure owner can only access their facilities
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        photos: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        courts: {
          select: {
            id: true,
            name: true,
            sportType: true,
            isActive: true,
            pricePerHour: true,
            capacity: true,
            description: true,
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
    });

    if (!facility) {
      console.log("GET /api/owner/facilities/[id] - Facility not found:");
      console.log("- Facility ID:", facilityId);
      console.log("- Owner ID:", session.user.id);
      return new Response('Facility not found', { status: 404 });
    }

    console.log("GET /api/owner/facilities/[id] - Facility found successfully:", facility.name);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facilityId,
        action: "fetch_facility_details",
      },
      message: 'Facility details retrieved successfully.',
    });

    return Response.json({
      facility,
      success: true,
    });
  } catch (error) {
    console.log("GET /api/owner/facilities/[id] - Error occurred:");
    console.log("- Error:", error);
    console.log("- Error message:", error instanceof Error ? error.message : 'Unknown error');
    
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      message: 'Failed to retrieve facility details.',
    });

    console.error('Facility details error:', error);

    return Response.json(
      { 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check user role
    if (session.user.role !== "facility_owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const { id: facilityId } = await params;
    const body = await request.json();

    // Validate the request body
    const validationResult = facilityUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if facility exists and belongs to the user
    const existingFacility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        ownerId: session.user.id,
      },
    });

    if (!existingFacility) {
      return new Response('Facility not found', { status: 404 });
    }

    // Update facility
    const updatedFacility = await prisma.facility.update({
      where: {
        id: facilityId,
      },
      data: {
        name: data.name,
        description: data.description || null,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        phone: data.phone,
        email: data.email || null,
        website: data.website || null,
        venueType: data.venueType,
        updatedAt: new Date(),
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        photos: true,
        courts: {
          select: {
            id: true,
            name: true,
            sportType: true,
            isActive: true,
          },
        },
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facilityId,
        action: "facility_updated",
      },
      message: 'Facility updated successfully.',
    });

    // Sync to Elasticsearch (non-blocking)
    safeSyncFacility(facilityId, 'update');

    return Response.json({
      facility: updatedFacility,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
      },
      message: 'Failed to update facility.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check user role
    if (session.user.role !== "facility_owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const { id: facilityId } = await params;

    // Check if facility exists and belongs to the user
    const existingFacility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        ownerId: session.user.id,
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
        },
      },
    });

    if (!existingFacility) {
      return new Response('Facility not found', { status: 404 });
    }

    // Check if there are active bookings
    if (existingFacility.bookings.length > 0) {
      return Response.json(
        { error: 'Cannot delete facility with active bookings' },
        { status: 400 }
      );
    }

    // Soft delete facility
    await prisma.facility.update({
      where: {
        id: facilityId,
      },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facilityId,
        action: "facility_deleted",
      },
      message: 'Facility deleted successfully.',
    });

    // Remove from Elasticsearch (non-blocking)
    safeSyncFacility(facilityId, 'delete');

    return Response.json({
      success: true,
      message: 'Facility deleted successfully',
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
      },
      message: 'Failed to delete facility.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
