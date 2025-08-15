import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { z } from "zod";

const updateMaintenanceSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id: params.id,
        court: {
          facility: {
            ownerId: session.user.id,
          },
        },
      },
      include: {
        court: {
          include: {
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!maintenance) {
      return new Response("Maintenance record not found", { status: 404 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "get_maintenance_details",
        maintenanceId: maintenance.id,
      },
      message: "Successfully retrieved maintenance record",
    });

    return Response.json({
      id: maintenance.id,
      title: maintenance.title,
      description: maintenance.description,
      startDate: maintenance.startDate,
      endDate: maintenance.endDate,
      isActive: maintenance.isActive,
      createdAt: maintenance.createdAt,
      court: {
        id: maintenance.court.id,
        name: maintenance.court.name,
        facility: {
          id: maintenance.court.facility.id,
          name: maintenance.court.facility.name,
        },
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch maintenance record",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMaintenanceSchema.parse(body);

    // Verify ownership
    const existingMaintenance = await prisma.maintenance.findFirst({
      where: {
        id: params.id,
        court: {
          facility: {
            ownerId: session.user.id,
          },
        },
      },
    });

    if (!existingMaintenance) {
      return new Response("Maintenance record not found", { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate);

    const maintenance = await prisma.maintenance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        court: {
          include: {
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "update_maintenance",
        maintenanceId: maintenance.id,
      },
      message: "Successfully updated maintenance record",
    });

    return Response.json({
      id: maintenance.id,
      title: maintenance.title,
      description: maintenance.description,
      startDate: maintenance.startDate,
      endDate: maintenance.endDate,
      isActive: maintenance.isActive,
      createdAt: maintenance.createdAt,
      court: {
        id: maintenance.court.id,
        name: maintenance.court.name,
        facility: {
          id: maintenance.court.facility.id,
          name: maintenance.court.facility.name,
        },
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ errors: error.errors }), { status: 400 });
    }

    globalThis?.logger?.error({
      err: error,
      message: "Failed to update maintenance record",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    // Verify ownership
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id: params.id,
        court: {
          facility: {
            ownerId: session.user.id,
          },
        },
      },
    });

    if (!maintenance) {
      return new Response("Maintenance record not found", { status: 404 });
    }

    await prisma.maintenance.delete({
      where: { id: params.id },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "delete_maintenance",
        maintenanceId: params.id,
      },
      message: "Successfully deleted maintenance record",
    });

    return Response.json({ success: true });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to delete maintenance record",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
