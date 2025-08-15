import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { safeSyncFacility } from "@/lib/search/facility-sync";

const createCourtSchema = z.object({
  facilityId: z.string().min(1),
  name: z.string().min(1, "Court name is required"),
  sportType: z.enum([
    "BADMINTON",
    "TENNIS", 
    "FOOTBALL",
    "BASKETBALL",
    "CRICKET",
    "SQUASH",
    "TABLE_TENNIS",
    "VOLLEYBALL",
    "SWIMMING",
    "GYM",
    "OTHER"
  ]),
  description: z.string().optional(),
  pricePerHour: z.number().min(0, "Price must be non-negative"),
  capacity: z.number().min(1).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  surface: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if user is facility owner
    if (session.user.role !== 'facility_owner') {
      return new Response('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const sportType = searchParams.get("sportType");
    const isActive = searchParams.get("isActive");

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId,
        sportType,
        isActive,
      },
      message: "Owner fetching courts.",
    });

    const where: any = {};

    if (facilityId) {
      // Verify the facility belongs to this owner
      const facility = await prisma.facility.findFirst({
        where: {
          id: facilityId,
          ownerId: session.user.id,
        },
      });

      if (!facility) {
        return new Response("Facility not found or access denied", { status: 404 });
      }

      where.facilityId = facilityId;
    } else {
      // Get all courts for owner's facilities
      const facilities = await prisma.facility.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      });

      where.facilityId = {
        in: facilities.map(f => f.id),
      };
    }

    if (sportType) {
      where.sportType = sportType;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const courts = await prisma.court.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            timeSlots: true,
          },
        },
      },
      orderBy: [
        { facility: { name: "asc" } },
        { name: "asc" },
      ],
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtsCount: courts.length,
      },
      message: "Owner courts fetched successfully.",
    });

    return Response.json({ courts });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch owner courts.",
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

    // Check if user is facility owner
    if (session.user.role !== 'facility_owner') {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCourtSchema.parse(body);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: validatedData.facilityId,
        courtName: validatedData.name,
      },
      message: "Owner creating new court.",
    });

    // Verify the facility belongs to this owner
    const facility = await prisma.facility.findFirst({
      where: {
        id: validatedData.facilityId,
        ownerId: session.user.id,
      },
    });

    if (!facility) {
      return new Response("Facility not found or access denied", { status: 404 });
    }

    // Check if court name already exists in this facility
    const existingCourt = await prisma.court.findFirst({
      where: {
        facilityId: validatedData.facilityId,
        name: validatedData.name,
      },
    });

    if (existingCourt) {
      return new Response("Court name already exists in this facility", { status: 400 });
    }

    const court = await prisma.court.create({
      data: {
        facilityId: validatedData.facilityId,
        name: validatedData.name,
        sportType: validatedData.sportType,
        description: validatedData.description,
        pricePerHour: validatedData.pricePerHour,
        capacity: validatedData.capacity,
        length: validatedData.length,
        width: validatedData.width,
        surface: validatedData.surface,
        isActive: true,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId: court.id,
        facilityId: validatedData.facilityId,
      },
      message: "Court created successfully.",
    });

    // Sync facility to Elasticsearch since court data affects search (non-blocking)
    safeSyncFacility(validatedData.facilityId, 'update');

    return Response.json({ court }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    globalThis?.logger?.error({
      err: error,
      message: "Failed to create court.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
