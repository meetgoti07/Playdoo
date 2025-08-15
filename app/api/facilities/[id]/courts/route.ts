import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
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

    const facilityId = params.id;
    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get("sportType");

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId,
        sportType,
      },
      message: "Fetching courts for facility.",
    });

    const where: any = {
      facilityId,
      isActive: true,
    };

    if (sportType) {
      where.sportType = sportType;
    }

    const courts = await prisma.court.findMany({
      where,
      select: {
        id: true,
        name: true,
        sportType: true,
        description: true,
        pricePerHour: true,
        capacity: true,
        length: true,
        width: true,
        surface: true,
        facility: {
          select: {
            id: true,
            name: true,
            rating: true,
            totalReviews: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId,
        courtsCount: courts.length,
      },
      message: "Courts fetched successfully.",
    });

    return Response.json({ courts });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch courts.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
