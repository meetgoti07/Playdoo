import { prisma } from "@/lib/prisma/prismaClient";
import { syncFacilityToElasticsearch, type Facility } from "./elasticsearch";

/**
 * Syncs a facility with Elasticsearch by fetching the full facility data from the database
 */
export async function syncFacilityById(facilityId: string, operation: 'create' | 'update' | 'delete') {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        facilityId,
        operation,
      },
      message: `Starting facility sync with Elasticsearch: ${operation}`,
    });

    if (operation === 'delete') {
      // For deletion, we only need the facility ID
      const result = await syncFacilityToElasticsearch('delete', { id: facilityId });
      
      if (result.success) {
        globalThis?.logger?.info({
          meta: {
            requestId: crypto.randomUUID(),
            facilityId,
            operation: 'delete',
          },
          message: 'Facility successfully deleted from Elasticsearch',
        });
      } else {
        globalThis?.logger?.error({
          err: result.error,
          meta: {
            facilityId,
            operation: 'delete',
          },
          message: 'Failed to delete facility from Elasticsearch',
        });
      }
      
      return result;
    }

    // For create/update operations, fetch the full facility data
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        courts: {
          where: { isActive: true },
          select: {
            sportType: true,
            pricePerHour: true,
            isActive: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
        },
        photos: {
          select: {
            url: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!facility) {
      const error = new Error(`Facility with id ${facilityId} not found`);
      globalThis?.logger?.error({
        err: error,
        meta: { facilityId, operation },
        message: 'Facility not found for Elasticsearch sync',
      });
      return { success: false, error };
    }

    // Only sync APPROVED and ACTIVE facilities to the search index
    if (facility.status !== 'APPROVED' || !facility.isActive) {
      globalThis?.logger?.info({
        meta: {
          facilityId,
          status: facility.status,
          isActive: facility.isActive,
          operation,
        },
        message: 'Skipping Elasticsearch sync for non-approved or inactive facility',
      });
      
      // If facility exists in Elasticsearch but is no longer approved/active, remove it
      if (operation === 'update') {
        return await syncFacilityToElasticsearch('delete', { id: facilityId });
      }
      
      return { success: true, skipped: true };
    }

    // Transform facility data to match Elasticsearch Facility interface
    const facilityForES: Facility = {
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
      rating: facility.rating || 0,
      totalReviews: facility.totalReviews,
      isActive: facility.isActive,
      courts: facility.courts.map(court => ({
        sportType: court.sportType,
        pricePerHour: court.pricePerHour,
        isActive: court.isActive,
      })),
      amenities: facility.amenities.map(fa => ({
        name: fa.amenity.name,
        icon: fa.amenity.icon,
      })),
      photos: facility.photos.map(photo => ({
        url: photo.url,
        isPrimary: photo.isPrimary,
      })),
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt,
    };

    const result = await syncFacilityToElasticsearch(operation, facilityForES);

    if (result.success) {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          facilityId,
          operation,
          facilityName: facility.name,
          courtsCount: facility.courts.length,
          amenitiesCount: facility.amenities.length,
        },
        message: `Facility successfully synced to Elasticsearch: ${operation}`,
      });
    } else {
      globalThis?.logger?.error({
        err: result.error,
        meta: {
          facilityId,
          operation,
          facilityName: facility.name,
        },
        message: `Failed to sync facility to Elasticsearch: ${operation}`,
      });
    }

    return result;
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        facilityId,
        operation,
      },
      message: 'Error during facility Elasticsearch sync',
    });
    
    console.error('Error syncing facility to Elasticsearch:', error);
    return { success: false, error };
  }
}

/**
 * Batch sync multiple facilities to Elasticsearch
 */
export async function batchSyncFacilities(facilityIds: string[], operation: 'create' | 'update' | 'delete') {
  const results = [];
  const batchSize = 10; // Process in batches to avoid overwhelming the system

  globalThis?.logger?.info({
    meta: {
      requestId: crypto.randomUUID(),
      facilityCount: facilityIds.length,
      operation,
    },
    message: `Starting batch facility sync with Elasticsearch`,
  });

  for (let i = 0; i < facilityIds.length; i += batchSize) {
    const batch = facilityIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(facilityId => 
      syncFacilityById(facilityId, operation)
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      const facilityId = batch[index];
      if (result.status === 'fulfilled') {
        results.push({ facilityId, ...result.value });
      } else {
        globalThis?.logger?.error({
          err: result.reason,
          meta: { facilityId, operation },
          message: 'Failed to sync facility in batch operation',
        });
        results.push({ facilityId, success: false, error: result.reason });
      }
    });

    // Small delay between batches to avoid overwhelming Elasticsearch
    if (i + batchSize < facilityIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  globalThis?.logger?.info({
    meta: {
      requestId: crypto.randomUUID(),
      totalFacilities: facilityIds.length,
      successCount,
      failureCount,
      operation,
    },
    message: `Completed batch facility sync with Elasticsearch`,
  });

  return {
    success: failureCount === 0,
    results,
    summary: {
      total: facilityIds.length,
      succeeded: successCount,
      failed: failureCount,
    },
  };
}

/**
 * Sync all approved and active facilities to Elasticsearch
 */
export async function syncAllFacilities() {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
      },
      message: 'Starting full facility sync to Elasticsearch',
    });

    const facilities = await prisma.facility.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
        },
        message: 'No approved and active facilities found for sync',
      });
      return { success: true, summary: { total: 0, succeeded: 0, failed: 0 } };
    }

    return await batchSyncFacilities(facilityIds, 'create');
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Error during full facility sync to Elasticsearch',
    });
    
    console.error('Error syncing all facilities to Elasticsearch:', error);
    return { success: false, error };
  }
}

/**
 * Helper function to safely sync facility without throwing errors
 * This can be used in API endpoints where we don't want sync failures to affect the main operation
 */
export async function safeSyncFacility(facilityId: string, operation: 'create' | 'update' | 'delete') {
  try {
    await syncFacilityById(facilityId, operation);
  } catch (error) {
    // Log the error but don't throw - the main database operation should not fail due to search sync issues
    globalThis?.logger?.error({
      err: error,
      meta: {
        facilityId,
        operation,
      },
      message: 'Non-critical error during facility Elasticsearch sync',
    });
    
    console.error('Non-critical facility sync error:', error);
  }
}
