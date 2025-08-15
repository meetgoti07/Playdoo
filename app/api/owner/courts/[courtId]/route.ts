import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { safeSyncFacility } from "@/lib/search/facility-sync";

const updateCourtSchema = z.object({
  name: z.string().min(1, "Court name is required").optional(),
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
  ]).optional(),
  description: z.string().optional(),
  pricePerHour: z.number().min(0, "Price must be non-negative").optional(),
  capacity: z.number().min(1).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  surface: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { courtId: string } }
) {
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

    const courtId = params.courtId;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Owner fetching court details.",
    });

    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        facility: {
          ownerId: session.user.id,
        },
      },
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
            maintenance: true,
          },
        },
      },
    });

    if (!court) {
      return new Response("Court not found", { status: 404 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Court details fetched successfully.",
    });

    return Response.json({ court });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch court details.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courtId: string } }
) {
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

    const courtId = params.courtId;
    const body = await request.json();
    const validatedData = updateCourtSchema.parse(body);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
        updateData: Object.keys(validatedData),
      },
      message: "Owner updating court.",
    });

    // Verify the court belongs to this owner
    const existingCourt = await prisma.court.findFirst({
      where: {
        id: courtId,
        facility: {
          ownerId: session.user.id,
        },
      },
      include: {
        facility: true,
      },
    });

    if (!existingCourt) {
      return new Response("Court not found", { status: 404 });
    }

    // Check if name is being updated and if it conflicts
    if (validatedData.name && validatedData.name !== existingCourt.name) {
      const nameConflict = await prisma.court.findFirst({
        where: {
          facilityId: existingCourt.facilityId,
          name: validatedData.name,
          id: { not: courtId },
        },
      });

      if (nameConflict) {
        return new Response("Court name already exists in this facility", { status: 400 });
      }
    }

    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: validatedData,
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
            maintenance: true,
          },
        },
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Court updated successfully.",
    });

    // Sync facility to Elasticsearch since court data affects search (non-blocking)
    safeSyncFacility(existingCourt.facilityId, 'update');

    return Response.json({ court: updatedCourt });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    globalThis?.logger?.error({
      err: error,
      message: "Failed to update court.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courtId: string } }
) {
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

    const courtId = params.courtId;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Owner deleting court.",
    });

    // Verify the court belongs to this owner
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        facility: {
          ownerId: session.user.id,
        },
      },
    });

    if (!court) {
      return new Response("Court not found", { status: 404 });
    }

    // Check if court has any active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        courtId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        bookingDate: {
          gte: new Date(),
        },
      },
    });

    if (activeBookings > 0) {
      return new Response(
        "Cannot delete court with active or future bookings",
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.court.update({
      where: { id: courtId },
      data: { isActive: false },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Court deleted successfully.",
    });

    // Sync facility to Elasticsearch since court data affects search (non-blocking)
    safeSyncFacility(court.facilityId, 'update');

    return Response.json({ message: "Court deleted successfully" });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to delete court.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
