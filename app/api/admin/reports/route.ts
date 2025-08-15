import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { NextRequest } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check user role
    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { type, title, description, reportedUserId, reportedFacilityId } = body;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        type,
        reportedUserId,
        reportedFacilityId,
      },
      message: "Admin creating new report",
    });

    // Validate required fields
    if (!type || !title || !description) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Validate reported entities exist if provided
    if (reportedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: reportedUserId },
      });
      if (!user) {
        return new Response("Reported user not found", { status: 404 });
      }
    }

    if (reportedFacilityId) {
      const facility = await prisma.facility.findUnique({
        where: { id: reportedFacilityId },
      });
      if (!facility) {
        return new Response("Reported facility not found", { status: 404 });
      }
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        type,
        title,
        description,
        reportedById: session.user.id, // Admin creating the report
        reportedUserId: reportedUserId || null,
        reportedFacilityId: reportedFacilityId || null,
        status: "PENDING",
      },
      include: {
        reportedBy: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
          },
        },
        reportedFacility: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REPORT_CREATED",
        entity: "report",
        entityId: report.id,
        newData: { type, title, description },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return Response.json({
      success: true,
      report,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to create report",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check user role
    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        page,
        limit,
        type,
        status,
        search,
      },
      message: "Admin reports list requested",
    });

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reportedBy: { name: { contains: search, mode: "insensitive" } } },
        { reportedBy: { email: { contains: search, mode: "insensitive" } } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { hashId: { equals: parseInt(search) || undefined } },
      ];
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          reportedUser: {
            select: {
              name: true,
            },
          },
          reportedFacility: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // Pending first
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    // Add priority based on report type and age
    const reportsWithPriority = reports.map((report) => {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let priority = "LOW";
      if (
        report.type === "SAFETY_CONCERN" ||
        (report.status === "PENDING" && daysSinceCreated > 7)
      ) {
        priority = "HIGH";
      } else if (
        report.type === "USER_BEHAVIOR" ||
        report.type === "FACILITY_ISSUE" ||
        (report.status === "PENDING" && daysSinceCreated > 3)
      ) {
        priority = "MEDIUM";
      }

      return {
        ...report,
        priority,
      };
    });

    const response = {
      reports: reportsWithPriority,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };

    return Response.json(response);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch admin reports",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
