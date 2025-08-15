import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";

const adminUpdateCourtSchema = z.object({
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
  adminNotes: z.string().optional(),
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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const courtId = params.courtId;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Admin fetching court details.",
    });

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            bookingDate: {
              gte: new Date(),
            },
          },
          take: 10,
          orderBy: { bookingDate: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        maintenance: {
          where: {
            isActive: true,
          },
          orderBy: { startDate: 'desc' },
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
      message: "Admin court details fetched successfully.",
    });

    return Response.json({ court });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin court details.",
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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const courtId = params.courtId;
    const body = await request.json();
    const validatedData = adminUpdateCourtSchema.parse(body);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
        updateData: Object.keys(validatedData),
      },
      message: "Admin updating court.",
    });

    // Verify the court exists
    const existingCourt = await prisma.court.findUnique({
      where: { id: courtId },
      include: { facility: true },
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
          include: {
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
    });

    // Log the admin action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_UPDATE_COURT',
        entity: 'court',
        entityId: courtId,
        oldData: existingCourt,
        newData: updatedCourt,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Admin court updated successfully.",
    });

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
      message: "Failed to update admin court.",
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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const courtId = params.courtId;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Admin deleting court.",
    });

    const court = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!court) {
      return new Response("Court not found", { status: 404 });
    }

    // Check if court has any future bookings
    const futureBookings = await prisma.booking.count({
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

    if (futureBookings > 0) {
      return new Response(
        "Cannot delete court with future bookings. Deactivate instead.",
        { status: 400 }
      );
    }

    // Hard delete the court
    await prisma.court.delete({
      where: { id: courtId },
    });

    // Log the admin action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DELETE_COURT',
        entity: 'court',
        entityId: courtId,
        oldData: court,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId,
      },
      message: "Admin court deleted successfully.",
    });

    return Response.json({ message: "Court deleted successfully" });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to delete admin court.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
