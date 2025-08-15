import { NextRequest } from 'next/server';
import { getFacilitySuggestions, getProductSuggestions, getSuggestions } from '@/lib/search/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: 'search/suggestions'
      },
      message: 'Search suggestions request received',
    });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, facility, product
    const size = parseInt(searchParams.get('size') || '5');

    if (!query.trim()) {
      return Response.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    let results;
    
    switch (type) {
      case 'facility':
        results = await getFacilitySuggestions(query, size);
        break;
      case 'product':
        results = await getProductSuggestions(query, size);
        break;
      default:
        // Get mixed suggestions - facilities and general content
        const [facilityResults, generalResults] = await Promise.all([
          getFacilitySuggestions(query, Math.ceil(size / 2)),
          getSuggestions(query, Math.floor(size / 2))
        ]);
        
        const generalSuggestions = Array.isArray(generalResults.suggestions) 
          ? generalResults.suggestions 
          : [];
        
        results = {
          success: facilityResults.success && generalResults.success,
          suggestions: [
            ...(facilityResults.suggestions || []),
            ...generalSuggestions.map((s: any) => ({
              type: 'general',
              name: s.text || s._source?.title || '',
              id: s._id || crypto.randomUUID(),
              text: s.text || s._source?.title || ''
            }))
          ].slice(0, size)
        };
        break;
    }

    if (!results.success) {
      globalThis?.logger?.error({
        err: results.error,
        meta: {
          query,
          type,
          size
        },
        message: 'Search suggestions failed',
      });

      return Response.json(
        { error: 'Suggestions failed', details: results.error },
        { status: 500 }
      );
    }

    return Response.json({
      query,
      type,
      suggestions: results.suggestions || []
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Search suggestions API error',
    });

    console.error('Search suggestions API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
