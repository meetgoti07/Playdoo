import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const { status } = await request.json();

    // Validate status
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return new Response("Invalid status. Must be ACTIVE or INACTIVE", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        adminId: session.user.id,
        targetUserId: userId,
        newStatus: status,
      },
      message: "Admin updating user status",
    });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!existingUser) {
      return new Response("User not found", { status: 404 });
    }

    // Prevent admins from changing their own status
    if (userId === session.user.id) {
      return new Response("Cannot modify your own status", { status: 400 });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        adminId: session.user.id,
        targetUserId: userId,
        oldStatus: existingUser.status,
        newStatus: status,
      },
      message: "User status updated successfully",
    });

    return Response.json({
      message: "User status updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to update user status",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
