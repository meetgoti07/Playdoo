import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
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

    const { reportId } = params;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        reportId,
      },
      message: "Admin requesting report details",
    });

    // Find report by hashId or id
    const report = await prisma.report.findFirst({
      where: {
        OR: [
          { id: reportId },
          { hashId: parseInt(reportId) || undefined },
        ],
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
            email: true,
            banned: true,
            banReason: true,
            banExpires: true,
          },
        },
        reportedFacility: {
          select: {
            name: true,
            address: true,
            status: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!report) {
      return new Response("Report not found", { status: 404 });
    }

    // Add priority based on report type and age
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

    const reportWithPriority = {
      ...report,
      priority,
    };

    return Response.json({
      report: reportWithPriority,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch report details",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
