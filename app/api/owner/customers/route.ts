import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { z } from "zod";

const customerQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
  sortBy: z.enum(["name", "totalBookings", "totalSpent", "lastBooking", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "facility_owner" && session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = customerQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const page = parseInt(validatedQuery.page);
    const limit = Math.min(parseInt(validatedQuery.limit), 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Get owner's facilities first
    const ownerFacilities = await prisma.facility.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    const facilityIds = ownerFacilities.map(f => f.id);

    if (facilityIds.length === 0) {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          userId: session.user.id,
          action: "get_customers",
        },
        message: "Owner has no facilities",
      });

      return Response.json({
        customers: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      });
    }

    // Build where clause for search
    const whereClause: any = {
      bookings: {
        some: {
          facilityId: { in: facilityIds },
        },
      },
    };

    if (validatedQuery.search) {
      whereClause.OR = [
        { name: { contains: validatedQuery.search, mode: "insensitive" } },
        { email: { contains: validatedQuery.search, mode: "insensitive" } },
      ];
    }

    // Get customers with aggregated data
    const customers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        bookings: {
          where: {
            facilityId: { in: facilityIds },
          },
          select: {
            id: true,
            finalAmount: true,
            createdAt: true,
            status: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: getOrderBy(validatedQuery.sortBy, validatedQuery.sortOrder),
    });

    // Get total count
    const totalCustomers = await prisma.user.count({
      where: whereClause,
    });

    // Process customer data
    const processedCustomers = customers.map(customer => {
      const totalBookings = customer.bookings.length;
      const totalSpent = customer.bookings
        .filter(b => b.status === "COMPLETED")
        .reduce((sum, booking) => sum + booking.finalAmount, 0);
      
      const lastBooking = customer.bookings.length > 0 
        ? customer.bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image: customer.image,
        createdAt: customer.createdAt,
        totalBookings,
        totalSpent,
        lastBooking: lastBooking ? {
          date: lastBooking.createdAt,
          status: lastBooking.status,
        } : null,
      };
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        action: "get_customers",
        customerCount: processedCustomers.length,
      },
      message: "Successfully retrieved owner customers",
    });

    return Response.json({
      customers: processedCustomers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limit),
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch customers",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

function getOrderBy(sortBy: string, sortOrder: string) {
  const order = sortOrder === "asc" ? "asc" : "desc";
  
  switch (sortBy) {
    case "name":
      return { name: order };
    case "createdAt":
      return { createdAt: order };
    default:
      return { createdAt: order };
  }
}
