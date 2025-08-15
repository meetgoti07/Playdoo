import { NextRequest } from 'next/server';
import { searchFacilities } from '@/lib/search/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: 'search/facilities'
      },
      message: 'Facility search request received',
    });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '*';
    const size = parseInt(searchParams.get('size') || '12');
    const from = parseInt(searchParams.get('from') || '0');
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;
    const sport = searchParams.get('sport') || undefined;
    const venueType = searchParams.get('venueType') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const rating = searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined;
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean) || undefined;
    const latitude = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const longitude = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined;
    const radius = searchParams.get('radius') || '25km';

    const results = await searchFacilities(query, {
      size,
      from,
      state,
      city,
      sport,
      venueType,
      minPrice,
      maxPrice,
      rating,
      amenities,
      latitude,
      longitude,
      radius
    });

    if (!results.success) {
      globalThis?.logger?.error({
        err: results.error,
        meta: {
          query,
          state,
          city,
          sport
        },
        message: 'Facility search failed',
      });

      return Response.json(
        { error: 'Search failed', details: results.error },
        { status: 500 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        query,
        resultCount: results.results?.length || 0,
        total: (results.total as any)?.value || 0,
        took: results.took
      },
      message: 'Facility search completed successfully',
    });

    return Response.json({
      query,
      results: results.results,
      total: results.total,
      took: results.took,
      aggregations: results.aggregations,
      pagination: {
        current_page: Math.floor(from / size) + 1,
        per_page: size,
        total_pages: Math.ceil(((results.total as any)?.value || 0) / size)
      }
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Facility search API error',
    });

    console.error('Facility search API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
