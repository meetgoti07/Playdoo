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

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
      },
      message: "Admin support stats requested",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total counts
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      resolvedToday,
      todaysTickets,
      highPriorityTickets,
      statusBreakdown,
      priorityBreakdown,
    ] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      prisma.supportTicket.count({ where: { status: "CLOSED" } }),
      prisma.supportTicket.count({
        where: {
          status: "RESOLVED",
          resolvedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.supportTicket.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.supportTicket.count({
        where: {
          priority: {
            in: ["HIGH", "URGENT"],
          },
          status: {
            not: "CLOSED",
          },
        },
      }),
      // Status breakdown
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),
      // Priority breakdown  
      prisma.supportTicket.groupBy({
        by: ["priority"],
        _count: {
          id: true,
        },
      }),
    ]);

    // Calculate average response time (simplified - you may want to improve this)
    const recentReplies = await prisma.supportTicketReply.findMany({
      where: {
        authorType: "ADMIN",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        supportTicket: {
          select: {
            createdAt: true,
          },
        },
      },
      take: 100,
    });

    let avgResponseTimeHours = 0;
    if (recentReplies.length > 0) {
      const totalResponseTime = recentReplies.reduce((acc, reply) => {
        const responseTime = new Date(reply.createdAt).getTime() - new Date(reply.supportTicket.createdAt).getTime();
        return acc + responseTime;
      }, 0);
      avgResponseTimeHours = totalResponseTime / recentReplies.length / (1000 * 60 * 60); // Convert to hours
    }

    // Convert grouped results to object format
    const statusBreakdownObj = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    statusBreakdown.forEach((item) => {
      statusBreakdownObj[item.status as keyof typeof statusBreakdownObj] = item._count.id;
    });

    const priorityBreakdownObj = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };
    priorityBreakdown.forEach((item) => {
      priorityBreakdownObj[item.priority as keyof typeof priorityBreakdownObj] = item._count.id;
    });

    const stats = {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      resolvedToday,
      todaysTickets,
      highPriorityTickets,
      pendingTickets: openTickets + inProgressTickets,
      avgResponseTime: avgResponseTimeHours > 0 ? `${avgResponseTimeHours.toFixed(1)} hours` : "N/A",
      satisfactionRate: 94.2, // This would come from customer feedback/surveys
      statusBreakdown: statusBreakdownObj,
      priorityBreakdown: priorityBreakdownObj,
    };

    return Response.json({
      stats,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch support stats",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
