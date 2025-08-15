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
      message: "Fetching support ticket replies",
    });

    // First check if the ticket exists and user has access
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        ...(session.user.role !== "admin" && { userId: session.user.id }),
      },
    });

    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }

    const replies = await prisma.supportTicketReply.findMany({
      where: {
        supportTicketId: ticketId,
      },
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
    });

    return Response.json({ replies });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch support ticket replies",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(
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
    const { message } = body;

    if (!message || !message.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketId,
      },
      message: "Creating support ticket reply",
    });

    // First check if the ticket exists and user has access
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        ...(session.user.role !== "admin" && { userId: session.user.id }),
      },
    });

    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }

    // Check if ticket is closed
    if (ticket.status === "CLOSED") {
      return new Response("Cannot reply to a closed ticket", { status: 400 });
    }

    const reply = await prisma.supportTicketReply.create({
      data: {
        supportTicketId: ticketId,
        userId: session.user.id,
        authorType: session.user.role === "admin" ? "ADMIN" : "USER",
        message: message.trim(),
      },
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

    // Update ticket status if it was resolved and user is replying
    if (ticket.status === "RESOLVED" && session.user.role !== "admin") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: "OPEN",
          resolvedAt: null,
        },
      });
    }

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_SUPPORT_REPLY",
        entity: "support_ticket_reply",
        entityId: reply.id,
        newData: {
          ticketId,
          authorType: reply.authorType,
        },
      },
    });

    return Response.json({
      message: "Reply created successfully",
      reply,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to create support ticket reply",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
