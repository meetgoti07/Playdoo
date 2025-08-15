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

    // Check user role
    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        exportFilters: { type, status, search },
      },
      message: "Admin exporting reports",
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

    const reports = await prisma.report.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            name: true,
            email: true,
          },
        },
        reportedFacility: {
          select: {
            name: true,
            address: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Convert to CSV
    const headers = [
      "Report ID",
      "Type",
      "Title",
      "Description",
      "Status",
      "Reporter Name",
      "Reporter Email",
      "Reported User",
      "Reported User Email",
      "Reported Facility",
      "Facility Address",
      "Created At",
      "Resolved At",
      "Admin Notes",
    ];

    const csvRows = [
      headers.join(","),
      ...reports.map(report => [
        report.hashId,
        report.type,
        `"${report.title.replace(/"/g, '""')}"`,
        `"${report.description.replace(/"/g, '""')}"`,
        report.status,
        `"${report.reportedBy.name || ''}"`,
        report.reportedBy.email || "",
        `"${report.reportedUser?.name || ''}"`,
        report.reportedUser?.email || "",
        `"${report.reportedFacility?.name || ''}"`,
        `"${report.reportedFacility?.address || ''}"`,
        new Date(report.createdAt).toISOString(),
        report.resolvedAt ? new Date(report.resolvedAt).toISOString() : "",
        `"${report.adminNotes || ''}"`,
      ].join(",")),
    ];

    const csvContent = csvRows.join("\n");
    const filename = `reports-export-${new Date().toISOString().split('T')[0]}.csv`;

    // Log the export activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REPORTS_EXPORTED",
        entity: "report",
        entityId: "bulk",
        newData: { 
          filters: { type, status, search },
          reportCount: reports.length 
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to export reports",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
