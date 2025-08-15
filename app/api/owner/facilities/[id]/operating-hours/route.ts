import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { z } from 'zod';

const operatingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().nullable(),
  closeTime: z.string().nullable(),
  isClosed: z.boolean(),
});

const operatingHoursUpdateSchema = z.object({
  operatingHours: z.array(operatingHourSchema),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check user role
    if (session.user.role !== "facility_owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const facilityId = params.id;
    const body = await request.json();

    // Validate the request body
    const validationResult = operatingHoursUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { operatingHours } = validationResult.data;

    // Check if facility exists and belongs to the user
    const existingFacility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        ownerId: session.user.id,
      },
    });

    if (!existingFacility) {
      return new Response('Facility not found', { status: 404 });
    }

    // Validate time format and logic
    for (const hour of operatingHours) {
      if (!hour.isClosed) {
        if (!hour.openTime || !hour.closeTime) {
          return Response.json(
            { error: 'Open and close times are required when not closed' },
            { status: 400 }
          );
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(hour.openTime) || !timeRegex.test(hour.closeTime)) {
          return Response.json(
            { error: 'Invalid time format. Use HH:MM format' },
            { status: 400 }
          );
        }

        // Check if open time is before close time
        const openTime = new Date(`2000-01-01T${hour.openTime}:00`);
        const closeTime = new Date(`2000-01-01T${hour.closeTime}:00`);
        
        if (openTime >= closeTime) {
          return Response.json(
            { error: 'Open time must be before close time' },
            { status: 400 }
          );
        }
      }
    }

    // Delete existing operating hours
    await prisma.operatingHour.deleteMany({
      where: {
        facilityId: facilityId,
      },
    });

    // Create new operating hours
    const createdHours = await prisma.operatingHour.createMany({
      data: operatingHours.map(hour => ({
        facilityId: facilityId,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.isClosed ? null : hour.openTime,
        closeTime: hour.isClosed ? null : hour.closeTime,
        isClosed: hour.isClosed,
      })),
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facilityId,
        hoursCreated: createdHours.count,
        action: "operating_hours_updated",
      },
      message: 'Operating hours updated successfully.',
    });

    return Response.json({
      success: true,
      message: 'Operating hours updated successfully',
      hoursCreated: createdHours.count,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        facilityId: params.id,
      },
      message: 'Failed to update operating hours.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check user role
    if (session.user.role !== "facility_owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const facilityId = params.id;

    // Check if facility exists and belongs to the user
    const facility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        ownerId: session.user.id,
      },
      include: {
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!facility) {
      return new Response('Facility not found', { status: 404 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facilityId,
        action: "fetch_operating_hours",
      },
      message: 'Operating hours retrieved successfully.',
    });

    return Response.json({
      operatingHours: facility.operatingHours,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        facilityId: params.id,
      },
      message: 'Failed to retrieve operating hours.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
