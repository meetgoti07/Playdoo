import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function POST(
  request: Request,
  { params }: { params: { reportId: string; action: string } }
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

    const { reportId, action } = params;
    const body = await request.json().catch(() => ({}));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        reportId,
        action,
      },
      message: `Admin report action: ${action}`,
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
        reportedBy: true,
        reportedUser: true,
        reportedFacility: true,
      },
    });

    if (!report) {
      return new Response("Report not found", { status: 404 });
    }

    let updatedReport;

    switch (action) {
      case "review":
        if (report.status !== "PENDING") {
          return new Response("Report cannot be reviewed", { status: 400 });
        }
        updatedReport = await prisma.report.update({
          where: { id: report.id },
          data: {
            status: "UNDER_REVIEW",
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "REPORT_UNDER_REVIEW",
            entity: "report",
            entityId: report.id,
            newData: { status: "UNDER_REVIEW" },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      case "resolve":
        if (report.status !== "UNDER_REVIEW") {
          return new Response("Report cannot be resolved", { status: 400 });
        }
        updatedReport = await prisma.report.update({
          where: { id: report.id },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            adminNotes: body.notes || null,
          },
        });

        // Handle different report types and their actions
        if (report.reportedUserId && body.banUser) {
          await prisma.user.update({
            where: { id: report.reportedUserId },
            data: {
              banned: true,
              banReason: `Resolved report: ${report.title}`,
              banExpires: body.banExpires ? new Date(body.banExpires) : null,
            },
          });
        }

        if (report.reportedFacilityId && body.suspendFacility) {
          await prisma.facility.update({
            where: { id: report.reportedFacilityId },
            data: {
              status: "SUSPENDED",
              rejectionReason: `Suspended due to report: ${report.title}`,
            },
          });
        }

        // Create notification for the reporter
        await prisma.notification.create({
          data: {
            userId: report.reportedById,
            type: "SYSTEM_UPDATE",
            title: "Report Resolved",
            message: `Your report "${report.title}" has been resolved.`,
            data: { reportId: report.id },
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "REPORT_RESOLVED",
            entity: "report",
            entityId: report.id,
            newData: { status: "RESOLVED", adminNotes: body.notes },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      case "dismiss":
        if (!["PENDING", "UNDER_REVIEW"].includes(report.status)) {
          return new Response("Report cannot be dismissed", { status: 400 });
        }
        updatedReport = await prisma.report.update({
          where: { id: report.id },
          data: {
            status: "DISMISSED",
            adminNotes: body.notes || null,
          },
        });

        // Create notification for the reporter
        await prisma.notification.create({
          data: {
            userId: report.reportedById,
            type: "SYSTEM_UPDATE",
            title: "Report Dismissed",
            message: `Your report "${report.title}" has been reviewed and dismissed.`,
            data: { reportId: report.id },
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "REPORT_DISMISSED",
            entity: "report",
            entityId: report.id,
            newData: { status: "DISMISSED", adminNotes: body.notes },
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        break;

      default:
        return new Response("Invalid action", { status: 400 });
    }

    return Response.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to perform report action",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
