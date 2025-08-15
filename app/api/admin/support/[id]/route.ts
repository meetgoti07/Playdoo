import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { NextRequest } from "next/server";

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

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const ticketId = params.id;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketId,
      },
      message: "Admin fetching support ticket details",
    });

    const [ticket, replies] = await Promise.all([
      prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.supportTicketReply.findMany({
        where: { supportTicketId: ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      })
    ]);

    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }

    return Response.json({ ticket, replies });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch support ticket",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
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

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const ticketId = params.id;
    const body = await request.json();
    const { status, message } = body;

    if (!status) {
      return new Response("Status is required", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketId,
        newStatus: status,
      },
      message: "Admin updating ticket status",
    });

    // Get current ticket
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return new Response("Ticket not found", { status: 404 });
    }

    const updateData: any = {
      status,
      assignedTo: session.user.id,
    };

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolvedAt = new Date();
    } else if (existingTicket.resolvedAt && status === "OPEN") {
      updateData.resolvedAt = null;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // If message is provided, create a reply
    if (message && message.trim()) {
      await prisma.supportTicketReply.create({
        data: {
          supportTicketId: ticketId,
          userId: session.user.id,
          authorType: "ADMIN",
          message: message.trim(),
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_TICKET_STATUS",
        entity: "support_ticket",
        entityId: ticketId,
        oldData: {
          status: existingTicket.status,
          assignedTo: existingTicket.assignedTo,
        },
        newData: {
          status,
          assignedTo: session.user.id,
          message: message ? message.substring(0, 100) + (message.length > 100 ? "..." : "") : null,
        },
      },
    });

    return Response.json({
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to update ticket status",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
