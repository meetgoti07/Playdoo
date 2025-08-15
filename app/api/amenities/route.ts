import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: '/api/amenities',
        method: 'GET',
      },
      message: 'Fetching available amenities',
    });

    const amenities = await prisma.amenity.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: '/api/amenities',
        amenitiesCount: amenities.length,
      },
      message: 'Successfully fetched amenities',
    });

    return Response.json({
      amenities,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        endpoint: '/api/amenities',
        method: 'GET',
      },
      message: 'Failed to fetch amenities',
    });

    return new Response('Failed to fetch amenities', { status: 500 });
  }
}
