import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

interface Params {
  params: {
    userId: string;
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

    const { userId, action } = params;

    if (!userId || !action) {
      return new Response("Missing required parameters", { status: 400 });
    }

    switch (action) {
      case "ban":
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: "BANNED",
            banned: true,
            banReason: "Banned by admin",
          },
        });

        // Log the action
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "USER_BANNED",
            entity: "user",
            entityId: userId,
            newData: { status: "BANNED", banned: true },
          },
        });
        break;

      case "unban":
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: "ACTIVE",
            banned: false,
            banReason: null,
          },
        });

        // Log the action
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: "USER_UNBANNED",
            entity: "user",
            entityId: userId,
            newData: { status: "ACTIVE", banned: false },
          },
        });
        break;

      case "delete":
        // First, delete related records or handle them appropriately
        await prisma.$transaction(async (tx) => {
          // Cancel all pending bookings
          await tx.booking.updateMany({
            where: {
              userId,
              status: { in: ["PENDING", "CONFIRMED"] },
            },
            data: {
              status: "CANCELLED",
              cancellationReason: "User account deleted",
            },
          });

          // Delete the user
          await tx.user.delete({
            where: { id: userId },
          });

          // Log the action
          await tx.activityLog.create({
            data: {
              userId: session.user.id,
              action: "USER_DELETED",
              entity: "user",
              entityId: userId,
            },
          });
        });
        break;

      default:
        return new Response("Invalid action", { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: `Failed to ${params.action} user`,
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
