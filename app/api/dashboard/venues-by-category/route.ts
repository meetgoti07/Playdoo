import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  
  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/dashboard/venues-by-category',
        city,
      },
      message: 'Fetching venues by category.',
    });

    // Get venues by venue type
    const venuesByType = await Promise.all([
      // Indoor venues
      prisma.facility.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
          venueType: 'INDOOR',
          ...(city && { city })
        },
        orderBy: { rating: 'desc' },
        take: 6,
        select: {
          id: true, // Get id (string) instead of hashId
          name: true,
          description: true,
          city: true,
          state: true,
          rating: true,
          totalReviews: true,
          venueType: true,
          courts: {
            select: {
              sportType: true,
              pricePerHour: true,
            },
            orderBy: {
              pricePerHour: 'asc'
            },
            take: 1
          },
          photos: {
            where: { isPrimary: true },
            select: { url: true, caption: true },
            take: 1
          }
        }
      }),
      
      // Outdoor venues
      prisma.facility.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
          venueType: 'OUTDOOR',
          ...(city && { city })
        },
        orderBy: { rating: 'desc' },
        take: 6,
        select: {
          id: true, // Get id (string) instead of hashId
          name: true,
          description: true,
          city: true,
          state: true,
          rating: true,
          totalReviews: true,
          venueType: true,
          courts: {
            select: {
              sportType: true,
              pricePerHour: true,
            },
            orderBy: {
              pricePerHour: 'asc'
            },
            take: 1
          },
          photos: {
            where: { isPrimary: true },
            select: { url: true, caption: true },
            take: 1
          }
        }
      }),

      // Premium venues (high rating + reviews)
      prisma.facility.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
          rating: { gte: 4.5 },
          totalReviews: { gte: 50 },
          ...(city && { city })
        },
        orderBy: [
          { rating: 'desc' },
          { totalReviews: 'desc' }
        ],
        take: 6,
        select: {
          id: true, // Get id (string) instead of hashId
          name: true,
          description: true,
          city: true,
          state: true,
          rating: true,
          totalReviews: true,
          venueType: true,
          courts: {
            select: {
              sportType: true,
              pricePerHour: true,
            },
            orderBy: {
              pricePerHour: 'asc'
            },
            take: 1
          },
          photos: {
            where: { isPrimary: true },
            select: { url: true, caption: true },
            take: 1
          }
        }
      }),

      // Budget-friendly venues
      prisma.facility.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
          courts: {
            some: {
              pricePerHour: { lte: 800 }
            }
          },
          ...(city && { city })
        },
        orderBy: { rating: 'desc' },
        take: 6,
        select: {
          id: true, // Get id (string) instead of hashId
          name: true,
          description: true,
          city: true,
          state: true,
          rating: true,
          totalReviews: true,
          venueType: true,
          courts: {
            select: {
              sportType: true,
              pricePerHour: true,
            },
            orderBy: {
              pricePerHour: 'asc'
            },
            take: 1
          },
          photos: {
            where: { isPrimary: true },
            select: { url: true, caption: true },
            take: 1
          }
        }
      })
    ]);

    // Get venues by city
    const venuesByCity = await prisma.facility.groupBy({
      by: ['city'],
      where: {
        status: 'APPROVED',
        isActive: true,
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 8
    });

    const citiesWithVenues = await Promise.all(
      venuesByCity.map(async (cityGroup) => {
        const venues = await prisma.facility.findMany({
          where: {
            status: 'APPROVED',
            isActive: true,
            city: cityGroup.city
          },
          orderBy: { rating: 'desc' },
          take: 4,
          select: {
            id: true, // Get id (string) instead of hashId
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
          city: cityGroup.city,
          venueCount: cityGroup._count.id,
          venues
        };
      })
    );

    // Format the venues to use id for client-side work
    const formatVenues = (venues: any[]) => 
      venues.map(venue => ({
        id: venue.id, // Use id (string) for client-side work
        name: venue.name,
        description: venue.description,
        city: venue.city,
        state: venue.state,
        rating: venue.rating,
        totalReviews: venue.totalReviews,
        venueType: venue.venueType,
        courts: venue.courts,
        photos: venue.photos,
      }));

    const formatCityVenues = (venues: any[]) =>
      venues.map(venue => ({
        id: venue.id, // Use id (string) for client-side work
        name: venue.name,
        city: venue.city,
        rating: venue.rating,
        photos: venue.photos,
      }));

    const result = {
      categories: [
        {
          title: 'Indoor Venues',
          description: 'Climate-controlled facilities for year-round play',
          venues: formatVenues(venuesByType[0])
        },
        {
          title: 'Outdoor Venues',
          description: 'Natural playing environments with fresh air',
          venues: formatVenues(venuesByType[1])
        },
        {
          title: 'Premium Venues',
          description: 'Top-rated facilities with excellent reviews',
          venues: formatVenues(venuesByType[2])
        },
        {
          title: 'Budget-Friendly',
          description: 'Affordable options without compromising quality',
          venues: formatVenues(venuesByType[3])
        }
      ],
      cities: citiesWithVenues.map(cityGroup => ({
        city: cityGroup.city,
        venueCount: cityGroup.venueCount,
        venues: formatCityVenues(cityGroup.venues)
      }))
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        categoriesCount: result.categories.length,
        citiesCount: result.cities.length,
      },
      message: 'Successfully fetched venues by category.',
    });

    return NextResponse.json(result);
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/dashboard/venues-by-category',
      },
      message: 'Failed to fetch venues by category.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
