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

    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        category: "asc",
      },
    });

    return Response.json(settings);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to fetch system settings",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
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

    const settingsData = await request.json();

    // Update or create settings
    const updatePromises = Object.entries(settingsData).map(([key, value]) => 
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          dataType: typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : "string",
          category: "general",
        },
      })
    );

    await Promise.all(updatePromises);

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SETTINGS_UPDATED",
        entity: "system_setting",
        entityId: "bulk_update",
        newData: settingsData,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to update system settings",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
