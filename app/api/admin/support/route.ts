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

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        filters: { status, priority, search, page, limit },
      },
      message: "Admin support tickets list requested",
    });

    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
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
      message: "Failed to fetch support tickets",
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

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      email,
      subject,
      message,
      priority = "MEDIUM",
    } = body;

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        ticketSubject: subject,
      },
      message: "Admin creating new support ticket",
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        email,
        subject,
        message,
        priority,
        status: "OPEN",
        assignedTo: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
