import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/dashboard/popular-sports',
      },
      message: 'Fetching popular sports.',
    });

    const popularSports = await prisma.court.groupBy({
      by: ['sportType'],
      where: {
        facility: {
          status: 'APPROVED',
          isActive: true,
        },
        isActive: true,
      },
      _count: {
        id: true
      },
      _avg: {
        pricePerHour: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 6
    });

    // Get sample facilities for each sport
    const sportsWithFacilities = await Promise.all(
      popularSports.map(async (sport) => {
        const facilities = await prisma.facility.findMany({
          where: {
            status: 'APPROVED',
            isActive: true,
            courts: {
              some: {
                sportType: sport.sportType,
                isActive: true
              }
            }
          },
          orderBy: {
            rating: 'desc'
          },
          take: 3,
          select: {
            id: true, // Use id (string) for client-side work
            name: true,
            city: true,
            rating: true,
            photos: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1
            }
          }
        });

        return {
          sportType: sport.sportType,
          venueCount: sport._count.id,
          averagePrice: Math.round(sport._avg.pricePerHour || 0),
          facilities
        };
      })
    );

    globalThis?.logger?.info({
      meta: {
        requestId,
        sportsCount: sportsWithFacilities.length,
      },
      message: 'Successfully fetched popular sports.',
    });

    return NextResponse.json({
      sports: sportsWithFacilities
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/dashboard/popular-sports',
      },
      message: 'Failed to fetch popular sports.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
