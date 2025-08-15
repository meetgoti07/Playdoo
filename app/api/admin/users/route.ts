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
        action: "fetch_admin_users",
      },
      message: "Admin fetching users list",
    });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              bookings: true,
              facilities: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map(user => ({
      id: user.id, // Use id (string) for client-side work
      hashId: user.hashId, // Include hashId for internal operations
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      image: user.image,
      phone: user.phone,
      city: user.city,
      state: user.state,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      _count: user._count,
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        usersCount: formattedUsers.length,
        totalCount,
        filters: { role, status, search },
      },
      message: "Admin users list fetched successfully",
    });

    return Response.json({
      users: formattedUsers,
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
      message: "Failed to fetch admin users",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
