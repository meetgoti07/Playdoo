import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const weekStart = searchParams.get('weekStart');

    if (!weekStart) {
      return Response.json(
        { error: 'weekStart is required' },
        { status: 400 }
      );
    }

    const startDate = new Date(weekStart);
    const endDate = endOfWeek(startDate);

    // Base query for facilities owned by the user
    const facilityFilter = facilityId 
      ? { id: facilityId, ownerId: session.user.id }
      : { ownerId: session.user.id };

    // Get facilities and their courts
    const facilities = await prisma.facility.findMany({
      where: facilityFilter,
      include: {
        courts: {
          where: { isActive: true },
          include: {
            timeSlots: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              include: {
                booking: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
              orderBy: [
                { date: 'asc' },
                { startTime: 'asc' },
              ],
            },
          },
        },
      },
    });

    // Transform data for weekly view
    const scheduleData = facilities.map(facility => ({
      id: facility.id,
      name: facility.name,
      courts: facility.courts.map(court => ({
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        pricePerHour: court.pricePerHour,
        timeSlots: court.timeSlots.map(slot => {
          // Helper function to format time properly
          const formatTime = (timeValue: any) => {
            if (!timeValue) return "00:00";
            
            try {
              // If it's already a time string in HH:mm format
              if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
                return timeValue;
              }
              
              // If it's a time string with seconds
              if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
                return timeValue.substring(0, 5);
              }
              
              // If it's a DateTime object, extract just the time part
              const dateObj = new Date(timeValue);
              if (isNaN(dateObj.getTime())) {
                console.warn('Invalid time value:', timeValue);
                return "00:00";
              }
              
              // Format as HH:mm
              return format(dateObj, 'HH:mm');
            } catch (error) {
              console.warn('Error formatting time:', timeValue, error);
              return "00:00";
            }
          };

          const slotData = {
            id: slot.id,
            date: format(new Date(slot.date), 'yyyy-MM-dd'), // Ensure proper date formatting
            startTime: formatTime(slot.startTime),
            endTime: formatTime(slot.endTime),
            isBlocked: slot.isBlocked,
            blockReason: slot.blockReason,
            isBooked: slot.isBooked,
            price: slot.price || court.pricePerHour,
            booking: slot.booking ? {
              id: slot.booking.id,
              status: slot.booking.status,
              user: slot.booking.user,
              totalAmount: slot.booking.totalAmount,
            } : null,
          };
          
          // Debug logging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('API slot data transformation:', {
              id: slotData.id,
              originalDate: slot.date,
              formattedDate: slotData.date,
              originalStartTime: slot.startTime,
              formattedStartTime: slotData.startTime,
              originalEndTime: slot.endTime,
              formattedEndTime: slotData.endTime,
              isBooked: slotData.isBooked,
              isBlocked: slotData.isBlocked,
              hasBooking: !!slotData.booking,
              bookingStatus: slotData.booking?.status
            });
          }
          
          return slotData;
        }),
      })),
    }));

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        facilityId: facilityId || 'all',
        weekStart: weekStart,
        facilitiesCount: facilities.length,
        totalSlotsReturned: scheduleData.reduce((total, facility) => 
          total + facility.courts.reduce((courtTotal, court) => 
            courtTotal + court.timeSlots.length, 0), 0),
        action: "fetch_schedule",
      },
      message: 'Schedule data retrieved successfully.',
    });

    return Response.json({
      schedule: scheduleData,
      weekStart: format(startDate, 'yyyy-MM-dd'),
      weekEnd: format(endDate, 'yyyy-MM-dd'),
      success: true,
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to retrieve schedule data.',
    });

    return new Response('Internal Server Error', { status: 500 });
  }
}
