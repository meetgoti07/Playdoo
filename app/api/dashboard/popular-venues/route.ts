import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/dashboard/popular-venues',
      },
      message: 'Fetching popular venues.',
    });

    // Try a simple query first
    const facilityCount = await prisma.facility.count();
    console.log('Facility count:', facilityCount);

    // Select all fields needed by PopularVenues component
    const popularVenues = await prisma.facility.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
      },
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' }
      ],
      take: 8,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        rating: true,
        totalReviews: true,
        venueType: true,
        photos: {
          take: 1,
          select: {
            url: true
          }
        },
        courts: {
          take: 1,
          orderBy: {
            pricePerHour: 'asc'
          },
          select: {
            sportType: true,
            pricePerHour: true
          }
        }
      }
    });

    console.log('Found venues:', popularVenues.length);

    return NextResponse.json({
      venues: popularVenues,
      count: facilityCount
    });
  } catch (error) {
    console.error('API Error:', error);
    
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/dashboard/popular-venues',
      },
      message: 'Failed to fetch popular venues.',
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
