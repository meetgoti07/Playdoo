import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { safeSyncFacility } from "@/lib/search/facility-sync";

interface Params {
  params: {
    facilityId: string;
    action: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { facilityId, action } = params;
    const body = await request.json();
    const { comments } = body;

    if (!facilityId || !action) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: { owner: true },
    });

    if (!facility) {
      return new Response("Facility not found", { status: 404 });
    }

    switch (action) {
      case "approve":
        await prisma.facility.update({
          where: { id: facilityId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            rejectionReason: null,
          },
        });

        // Log the action
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "FACILITY_APPROVED",
            entity: "facility",
            entityId: facilityId,
            newData: { status: "APPROVED", comments },
          },
        });

        // Add to Elasticsearch since it's now approved (non-blocking)
        safeSyncFacility(facilityId, 'create');

        // TODO: Send approval notification email to facility owner
        break;

      case "reject":
        if (!comments?.trim()) {
          return new Response("Rejection reason is required", { status: 400 });
        }

        await prisma.facility.update({
          where: { id: facilityId },
          data: {
            status: "REJECTED",
            rejectedAt: new Date(),
            rejectionReason: comments,
          },
        });

        // Log the action
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "FACILITY_REJECTED",
            entity: "facility",
            entityId: facilityId,
            newData: { status: "REJECTED", rejectionReason: comments },
          },
        });

        // Remove from Elasticsearch if it was previously approved (non-blocking)
        safeSyncFacility(facilityId, 'delete');

        // TODO: Send rejection notification email to facility owner
        break;

      default:
        return new Response("Invalid action", { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: `Failed to ${params.action} facility`,
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
