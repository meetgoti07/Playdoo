import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { addDays, format } from 'date-fns';

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

    // Handle empty body by providing defaults
    let body;
    try {
      body = await request.json();
    } catch (error) {
      body = {}; // Default to empty object if no body provided
    }
    
    const { days = 30, facilityId } = body; // Generate for next 30 days by default

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        days,
        facilityId,
        action: "generate_time_slots",
      },
      message: 'Generating time slots for facilities.',
    });

    // Get facilities for this owner
    const whereClause: any = {
      ownerId: session.user.id,
      isActive: true,
    };

    if (facilityId) {
      whereClause.id = facilityId;
    }

    const facilities = await prisma.facility.findMany({
      where: whereClause,
      include: {
        courts: {
          where: { isActive: true },
        },
        operatingHours: true,
      },
    });

    if (facilities.length === 0) {
      return Response.json(
        { error: 'No active facilities found' },
        { status: 404 }
      );
    }

    let totalSlotsCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const facility of facilities) {
      if (facility.courts.length === 0) continue;

      // Generate slots for each day
      for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const targetDate = addDays(today, dayOffset);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

        // Find operating hours for this day
        const operatingHour = facility.operatingHours.find(
          oh => oh.dayOfWeek === dayOfWeek
        );

        if (!operatingHour || operatingHour.isClosed) {
          continue; // Skip if facility is closed on this day
        }

        // Generate hourly slots for each court
        for (const court of facility.courts) {
          const openTime = operatingHour.openTime; // e.g., "09:00"
          const closeTime = operatingHour.closeTime; // e.g., "22:00"

          const [openHour, openMin] = openTime.split(':').map(Number);
          const [closeHour, closeMin] = closeTime.split(':').map(Number);

          const openMinutes = openHour * 60 + openMin;
          const closeMinutes = closeHour * 60 + closeMin;

          // Generate hourly slots
          for (let minutes = openMinutes; minutes < closeMinutes; minutes += 60) {
            const startHour = Math.floor(minutes / 60);
            const startMin = minutes % 60;
            const endHour = Math.floor((minutes + 60) / 60);
            const endMin = (minutes + 60) % 60;

            const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

            // Check if slot already exists
            const existingSlot = await prisma.timeSlot.findFirst({
              where: {
                courtId: court.id,
                date: targetDate,
                startTime: startTime,
                endTime: endTime,
              },
            });

            if (!existingSlot) {
              await prisma.timeSlot.create({
                data: {
                  courtId: court.id,
                  date: targetDate,
                  startTime: startTime,
                  endTime: endTime,
                  isBlocked: false,
                  isBooked: false,
                  price: court.pricePerHour,
                },
              });
              totalSlotsCreated++;
            }
          }
        }
      }
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilitiesProcessed: facilities.length,
        totalSlotsCreated,
        daysGenerated: days,
      },
      message: 'Time slots generated successfully.',
    });

    return Response.json({
      message: 'Time slots generated successfully',
      facilitiesProcessed: facilities.length,
      totalSlotsCreated,
      daysGenerated: days,
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        userId: session?.user?.id,
      },
      message: 'Failed to generate time slots.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
