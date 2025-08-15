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

    const ticketId = params.id;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketId,
      },
      message: "Fetching support ticket details",
    });

    // Build where clause based on user role
    const where: any = { id: ticketId };
    
    // If not admin, user can only see their own tickets
    if (session.user.role !== "admin") {
      where.userId = session.user.id;
    }

    const ticket = await prisma.supportTicket.findFirst({
      where,
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

    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }

    return Response.json({ ticket });
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

    const ticketId = params.id;
    const body = await request.json();

    // Check if ticket exists and user has permission
    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        ...(session.user.role !== "admin" && { userId: session.user.id }),
      },
    });

    if (!existingTicket) {
      return new Response("Ticket not found", { status: 404 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketId,
        updates: Object.keys(body),
      },
      message: "Updating support ticket",
    });

    // Only admins can update status, priority, and assignedTo
    const updateData: any = {};
    
    if (session.user.role === "admin") {
      if (body.status) updateData.status = body.status;
      if (body.priority) updateData.priority = body.priority;
      if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
      
      if (body.status === "RESOLVED" || body.status === "CLOSED") {
        updateData.resolvedAt = new Date();
      } else if (existingTicket.resolvedAt && body.status === "OPEN") {
        updateData.resolvedAt = null;
      }
    }

    // Users can only update message (add responses)
    if (body.message && session.user.role !== "admin") {
      updateData.message = body.message;
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_SUPPORT_TICKET",
        entity: "support_ticket",
        entityId: ticketId,
        oldData: {
          status: existingTicket.status,
          priority: existingTicket.priority,
        },
        newData: updateData,
      },
    });

    return Response.json({
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to update support ticket",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
