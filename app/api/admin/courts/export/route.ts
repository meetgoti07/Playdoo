import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/prismaClient";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get("sportType");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        filters: { sportType, isActive, search },
      },
      message: "Admin exporting courts data.",
    });

    const where: any = {};

    if (sportType) {
      where.sportType = sportType;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { facility: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const courts = await prisma.court.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            status: true,
            address: true,
            city: true,
            state: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            timeSlots: true,
            maintenance: true,
          },
        },
      },
      orderBy: [
        { facility: { name: "asc" } },
        { name: "asc" },
      ],
    });

    // Convert to CSV format
    const csvHeaders = [
      'Court ID',
      'Court Name',
      'Sport Type',
      'Facility Name',
      'Facility Status',
      'Owner Name',
      'Owner Email',
      'Owner Phone',
      'Price Per Hour',
      'Capacity',
      'Dimensions (L x W)',
      'Surface',
      'Status',
      'Total Bookings',
      'Time Slots',
      'Maintenance Records',
      'Location',
      'Created Date',
      'Last Updated'
    ];

    const csvRows = courts.map(court => [
      court.hashId,
      court.name,
      court.sportType.replace('_', ' '),
      court.facility.name,
      court.facility.status,
      court.facility.owner.name,
      court.facility.owner.email,
      court.facility.owner.phone || 'N/A',
      `₹${court.pricePerHour}`,
      court.capacity || 'N/A',
      court.length && court.width ? `${court.length}m x ${court.width}m` : 'N/A',
      court.surface || 'N/A',
      court.isActive ? 'Active' : 'Inactive',
      court._count.bookings,
      court._count.timeSlots,
      court._count.maintenance,
      `${court.facility.city}, ${court.facility.state}`,
      new Date(court.createdAt).toLocaleDateString(),
      new Date(court.updatedAt).toLocaleDateString()
    ]);

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtsExported: courts.length,
      },
      message: "Courts data exported successfully.",
    });

    // Return CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="courts-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to export courts data.",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
