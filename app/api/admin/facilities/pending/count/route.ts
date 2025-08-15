import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function GET() {
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

    const count = await prisma.facility.count({
      where: { status: "PENDING" },
    });

    return Response.json({ count });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch pending facilities count",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
