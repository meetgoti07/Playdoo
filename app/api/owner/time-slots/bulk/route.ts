import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { z } from 'zod';

const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  price: z.number().min(0, 'Price must be non-negative'),
});

const bulkTimeSlotsSchema = z.object({
  courtId: z.string().min(1, 'Court ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlots: z.array(timeSlotSchema).min(1, 'At least one time slot is required'),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate the request body
    const validationResult = bulkTimeSlotsSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { courtId, date, timeSlots } = validationResult.data;
    const targetDate = new Date(date + 'T00:00:00.000Z');

    // Verify court ownership and get facility info
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        facility: {
          ownerId: session.user.id,
        },
      },
      include: {
        facility: {
          include: {
            operatingHours: {
              where: {
                dayOfWeek: targetDate.getDay(),
              },
            },
          },
        },
      },
    });

    if (!court) {
      return new Response('Court not found or access denied', { status: 404 });
    }

    // Check if facility is approved
    if (court.facility.status !== 'APPROVED') {
      return Response.json(
        { error: 'Facility must be approved before managing time slots' },
        { status: 400 }
      );
    }

    // Check operating hours
    const operatingHour = court.facility.operatingHours[0];
    if (!operatingHour || operatingHour.isClosed) {
      return Response.json(
        { error: 'Facility is closed on this day' },
        { status: 400 }
      );
    }

    // Validate all time slots against operating hours
    const facilityOpen = new Date(`2000-01-01T${operatingHour.openTime}:00`);
    const facilityClose = new Date(`2000-01-01T${operatingHour.closeTime}:00`);

    for (const slot of timeSlots) {
      const slotStart = new Date(`2000-01-01T${slot.startTime}:00`);
      const slotEnd = new Date(`2000-01-01T${slot.endTime}:00`);

      // Validate time logic
      if (slotStart >= slotEnd) {
        return Response.json(
          { error: `Invalid time slot: ${slot.startTime} - ${slot.endTime}. Start time must be before end time.` },
          { status: 400 }
        );
      }

      // Validate against facility hours
      if (slotStart < facilityOpen || slotEnd > facilityClose) {
        return Response.json(
          { error: `Time slot ${slot.startTime} - ${slot.endTime} is outside facility operating hours (${operatingHour.openTime} - ${operatingHour.closeTime})` },
          { status: 400 }
        );
      }
    }

    // Check for overlapping time slots
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1Start = new Date(`2000-01-01T${timeSlots[i].startTime}:00`);
        const slot1End = new Date(`2000-01-01T${timeSlots[i].endTime}:00`);
        const slot2Start = new Date(`2000-01-01T${timeSlots[j].startTime}:00`);
        const slot2End = new Date(`2000-01-01T${timeSlots[j].endTime}:00`);

        // Check for overlap
        if (slot1Start < slot2End && slot2Start < slot1End) {
          return Response.json(
            { error: `Overlapping time slots: ${timeSlots[i].startTime}-${timeSlots[i].endTime} and ${timeSlots[j].startTime}-${timeSlots[j].endTime}` },
            { status: 400 }
          );
        }
      }
    }

    // Use transaction to delete existing slots and create new ones
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing time slots for this court and date
      await tx.timeSlot.deleteMany({
        where: {
          courtId: courtId,
          date: targetDate,
        },
      });

      // Create new time slots
      const createdSlots = [];
      for (const slot of timeSlots) {
        // Create DateTime objects for startTime and endTime
        const startDateTime = new Date(targetDate);
        const endDateTime = new Date(targetDate);
        
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        
        startDateTime.setHours(startHour, startMin, 0, 0);
        endDateTime.setHours(endHour, endMin, 0, 0);

        const createdSlot = await tx.timeSlot.create({
          data: {
            courtId: courtId,
            date: targetDate,
            startTime: startDateTime,
            endTime: endDateTime,
            price: slot.price,
          },
        });
        
        createdSlots.push(createdSlot);
      }

      return createdSlots;
    });

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        courtId: courtId,
        date: date,
        slotsCreated: result.length,
        action: "bulk_create_time_slots",
      },
      message: 'Time slots created successfully.',
    });

    return Response.json({
      success: true,
      message: `Created ${result.length} time slots successfully`,
      slotsCreated: result.length,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to create time slots.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
