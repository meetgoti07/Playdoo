import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const sportType = searchParams.get('sportType');
    const venueType = searchParams.get('venueType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/venues',
        filters: {
          page,
          limit,
          city,
          state,
          sportType,
          venueType,
          minPrice,
          maxPrice,
          minRating,
          search,
          sortBy,
          sortOrder
        },
      },
      message: 'Fetching venues with filters and pagination.',
    });

    // Build where clause for filtering
    const where: any = {
      status: 'APPROVED',
      isActive: true,
    };

    // City filter - exact match
    if (city) {
      where.city = city.trim();
    }

    // State filter - exact match
    if (state) {
      where.state = state.trim();
    }

    // Venue type filter
    if (venueType) {
      where.venueType = venueType;
    }

    // Rating filter
    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating)
      };
    }

    // Search filter (name, description, city)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          city: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Sport type and price filters (need to filter by courts)
    if (sportType || minPrice || maxPrice) {
      const courtWhere: any = {
        isActive: true
      };

      if (sportType) {
        courtWhere.sportType = sportType;
      }

      if (minPrice || maxPrice) {
        courtWhere.pricePerHour = {};
        if (minPrice) {
          courtWhere.pricePerHour.gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          courtWhere.pricePerHour.lte = parseFloat(maxPrice);
        }
      }

      where.courts = {
        some: courtWhere
      };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder };
        break;
      case 'rating':
        orderBy = { rating: sortOrder };
        break;
      case 'price':
        // For price sorting, we'll need a subquery approach
        orderBy = { 
          courts: {
            _count: sortOrder // This is a fallback, we'll handle price sorting differently
          }
        };
        break;
      case 'reviews':
        orderBy = { totalReviews: sortOrder };
        break;
      case 'created':
        orderBy = { createdAt: sortOrder };
        break;
      default:
        orderBy = { rating: 'desc' };
    }

    // Execute queries in parallel for better performance
    const [venues, totalCount] = await Promise.all([
      // Fetch venues
      prisma.facility.findMany({
        where,
        select: {
          id: true, // Use id (string) for client-side work
          name: true,
          description: true,
          city: true,
          state: true,
          rating: true,
          totalReviews: true,
          venueType: true,
          createdAt: true,
          courts: {
            where: { isActive: true },
            select: {
              id: true,
              sportType: true,
              pricePerHour: true,
            },
            orderBy: {
              pricePerHour: 'asc'
            },
            take: 3 // Get top 3 courts for display
          },
          photos: {
            where: { isPrimary: true },
            select: { 
              id: true,
              url: true, 
              caption: true 
            },
            take: 1
          },
          amenities: {
            select: {
              amenity: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                }
              }
            },
            take: 5 // Show top 5 amenities
          }
        },
        orderBy,
        skip,
        take: limit,
      }),

      // Get total count for pagination
      prisma.facility.count({ where }),
    ]);

    // Get min and max prices for filter range
    const priceRange = await prisma.court.aggregate({
      where: {
        isActive: true,
        facility: {
          status: 'APPROVED',
          isActive: true,
        }
      },
      _min: { pricePerHour: true },
      _max: { pricePerHour: true }
    });

    // Transform venues data for response
    const transformedVenues = venues.map(venue => ({
      id: venue.id,
      name: venue.name,
      description: venue.description,
      city: venue.city,
      state: venue.state,
      rating: venue.rating || 0,
      totalReviews: venue.totalReviews,
      venueType: venue.venueType,
      createdAt: venue.createdAt,
      minPrice: venue.courts.length > 0 ? Math.min(...venue.courts.map(c => c.pricePerHour)) : 0,
      maxPrice: venue.courts.length > 0 ? Math.max(...venue.courts.map(c => c.pricePerHour)) : 0,
      sportTypes: [...new Set(venue.courts.map(c => c.sportType))],
      primaryPhoto: venue.photos[0]?.url || null,
      amenities: venue.amenities.map(a => ({
        id: a.amenity.id,
        name: a.amenity.name,
        icon: a.amenity.icon,
      })).slice(0, 5)
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      venues: transformedVenues,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      },
      filters: {
        cities: [], // Will be loaded by the frontend via useLocations hook
        states: [], // Will be loaded by the frontend via useLocations hook
        priceRange: {
          min: priceRange._min.pricePerHour || 0,
          max: priceRange._max.pricePerHour || 5000
        },
        sportTypes: ['BADMINTON', 'TENNIS', 'FOOTBALL', 'BASKETBALL', 'CRICKET', 'SQUASH', 'TABLE_TENNIS', 'VOLLEYBALL', 'SWIMMING', 'GYM', 'OTHER'],
        venueTypes: ['INDOOR', 'OUTDOOR', 'HYBRID']
      }
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/venues',
        venuesCount: transformedVenues.length,
        totalCount,
        currentPage: page,
        totalPages,
      },
      message: 'Venues fetched successfully with pagination and filters.',
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Venues API Error:', error);
    
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/venues',
      },
      message: 'Failed to fetch venues.',
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
