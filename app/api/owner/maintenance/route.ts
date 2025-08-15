import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { z } from "zod";

const maintenanceQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  status: z.enum(["active", "completed", "all"]).optional().default("all"),
  courtId: z.string().optional(),
  facilityId: z.string().optional(),
});

const createMaintenanceSchema = z.object({
  courtId: z.string().min(1, "Court ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

const updateMaintenanceSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const validatedQuery = maintenanceQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      status: searchParams.get("status") || "all",
      courtId: searchParams.get("courtId") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
    });

    const page = parseInt(validatedQuery.page);
    const limit = Math.min(parseInt(validatedQuery.limit), 100);
    const offset = (page - 1) * limit;

    // Get owner's facilities
    const ownerFacilities = await prisma.facility.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    const facilityIds = ownerFacilities.map(f => f.id);

    if (facilityIds.length === 0) {
      return Response.json({
        maintenance: [],
        pagination: { page, limit, total: 0, pages: 0 },
        stats: { total: 0, active: 0, completed: 0 },
      });
    }

    // Build where clause
    const whereClause: any = {
      court: {
        facilityId: { in: facilityIds },
      },
    };

    if (validatedQuery.status === "active") {
      whereClause.isActive = true;
      whereClause.endDate = { gte: new Date() };
    } else if (validatedQuery.status === "completed") {
      whereClause.OR = [
        { isActive: false },
        { endDate: { lt: new Date() } },
      ];
    }

    if (validatedQuery.courtId) {
      whereClause.courtId = validatedQuery.courtId;
    }

    if (validatedQuery.facilityId) {
      whereClause.court.facilityId = validatedQuery.facilityId;
    }

    // Get maintenance records
    const maintenance = await prisma.maintenance.findMany({
      where: whereClause,
      include: {
        court: {
          include: {
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
      skip: offset,
      take: limit,
    });

    // Get total count
    const totalMaintenance = await prisma.maintenance.count({
      where: whereClause,
    });

    // Get stats
    const stats = await getMaintenanceStats(facilityIds);

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "get_maintenance",
        count: maintenance.length,
      },
      message: "Successfully retrieved maintenance records",
    });

    return Response.json({
      maintenance: maintenance.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        startDate: m.startDate,
        endDate: m.endDate,
        isActive: m.isActive,
        createdAt: m.createdAt,
        court: {
          id: m.court.id,
          name: m.court.name,
          facility: {
            id: m.court.facility.id,
            name: m.court.facility.name,
          },
        },
        status: getMaintenanceStatus(m),
      })),
      pagination: {
        page,
        limit,
        total: totalMaintenance,
        pages: Math.ceil(totalMaintenance / limit),
      },
      stats,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch maintenance records",
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

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // Verify court ownership
    const court = await prisma.court.findFirst({
      where: {
        id: validatedData.courtId,
        facility: {
          ownerId: session.user.id,
        },
      },
    });

    if (!court) {
      return new Response("Court not found or unauthorized", { status: 404 });
    }

    // Create maintenance record
    const maintenance = await prisma.maintenance.create({
      data: {
        courtId: validatedData.courtId,
        title: validatedData.title,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        isActive: true,
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

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "create_maintenance",
        maintenanceId: maintenance.id,
      },
      message: "Successfully created maintenance record",
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
      status: getMaintenanceStatus(maintenance),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ errors: error.errors }), { status: 400 });
    }

    globalThis?.logger?.error({
      err: error,
      message: "Failed to create maintenance record",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

async function getMaintenanceStats(facilityIds: string[]) {
  const now = new Date();
  
  const [total, active, completed] = await Promise.all([
    prisma.maintenance.count({
      where: {
        court: { facilityId: { in: facilityIds } },
      },
    }),
    prisma.maintenance.count({
      where: {
        court: { facilityId: { in: facilityIds } },
        isActive: true,
        endDate: { gte: now },
      },
    }),
    prisma.maintenance.count({
      where: {
        court: { facilityId: { in: facilityIds } },
        OR: [
          { isActive: false },
          { endDate: { lt: now } },
        ],
      },
    }),
  ]);

  return { total, active, completed };
}

function getMaintenanceStatus(maintenance: any) {
  const now = new Date();
  const startDate = new Date(maintenance.startDate);
  const endDate = new Date(maintenance.endDate);

  if (!maintenance.isActive || endDate < now) {
    return "completed";
  }
  
  if (startDate <= now && endDate >= now) {
    return "active";
  }
  
  return "scheduled";
}
