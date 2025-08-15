import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const ticketId = params.id;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketId,
      },
      message: "Admin replying to support ticket",
    });

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Create reply using the SupportTicketReply model
    const reply = await prisma.supportTicketReply.create({
      data: {
        supportTicketId: ticketId,
        userId: session.user.id,
        authorType: "ADMIN",
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

    // Update ticket status and timestamp
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        // If ticket was resolved and admin is replying, mark as in progress
        ...(ticket.status === "RESOLVED" && { status: "IN_PROGRESS" }),
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_SUPPORT_REPLY",
        entity: "support_ticket_reply",
        entityId: reply.id,
        newData: {
          ticketId,
          authorType: "ADMIN",
          message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
        },
      },
    });

    // TODO: Send email notification to customer about the reply
    // You can use your email service here to notify the customer

    return NextResponse.json({
      message: "Reply sent successfully",
      reply,
      ticket: updatedTicket,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to send admin reply to support ticket",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
