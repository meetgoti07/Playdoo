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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // Build where clause - users can only see their own tickets
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        filters: { status, page, limit },
      },
      message: "User support tickets list requested",
    });

    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          hashId: true,
          subject: true,
          message: true,
          status: true,
          priority: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return Response.json({
      tickets,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch user support tickets",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const {
      subject,
      message,
      priority = "MEDIUM",
    } = body;

    if (!subject || !message) {
      return new Response("Subject and message are required", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketSubject: subject,
      },
      message: "User creating new support ticket",
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        subject,
        message,
        priority,
        status: "OPEN",
      },
      select: {
        id: true,
        hashId: true,
        subject: true,
        message: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_SUPPORT_TICKET",
        entity: "support_ticket",
        entityId: ticket.id,
        newData: {
          id: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
        },
      },
    });

    return Response.json({
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to create support ticket",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
