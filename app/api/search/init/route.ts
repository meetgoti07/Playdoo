import { NextRequest } from 'next/server';
import { initializeIndices, bulkIndexFacilities } from '@/lib/search/elasticsearch';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: 'search/init'
      },
      message: 'Initializing Elasticsearch indices',
    });

    // Initialize indices
    await initializeIndices();

    // Fetch facilities from database and index them
    const facilities = await prisma.facility.findMany({
      where: {
        isActive: true,
        status: 'APPROVED'
      },
      include: {
        courts: {
          where: {
            isActive: true
          },
          select: {
            sportType: true,
            pricePerHour: true,
            isActive: true
          }
        },
        amenities: {
          include: {
            amenity: {
              select: {
                name: true,
                icon: true
              }
            }
          }
        },
        photos: {
          select: {
            url: true,
            isPrimary: true
          }
        }
      }
    });

    // Transform facilities for Elasticsearch
    const facilitiesForES = facilities.map(facility => ({
      id: facility.id,
      hashId: facility.hashId.toString(),
      name: facility.name,
      description: facility.description || '',
      address: facility.address,
      city: facility.city,
      state: facility.state,
      country: facility.country,
      pincode: facility.pincode,
      latitude: facility.latitude,
      longitude: facility.longitude,
      phone: facility.phone,
      email: facility.email,
      website: facility.website,
      venueType: facility.venueType,
      rating: facility.rating,
      totalReviews: facility.totalReviews,
      isActive: facility.isActive,
      courts: facility.courts,
      amenities: facility.amenities.map(fa => ({
        name: fa.amenity.name,
        icon: fa.amenity.icon
      })),
      photos: facility.photos,
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt
    }));

    // Bulk index facilities
    if (facilitiesForES.length > 0) {
      const result = await bulkIndexFacilities(facilitiesForES);
      
      if (!result.success) {
        throw new Error('Failed to bulk index facilities');
      }
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        facilitiesIndexed: facilitiesForES.length
      },
      message: 'Elasticsearch indices initialized successfully',
    });

    return Response.json({
      success: true,
      message: 'Elasticsearch indices initialized successfully',
      facilitiesIndexed: facilitiesForES.length
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to initialize Elasticsearch indices',
    });

    console.error('Elasticsearch initialization error:', error);
    return Response.json(
      { error: 'Failed to initialize indices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
