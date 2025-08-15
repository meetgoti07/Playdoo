import { NextRequest } from 'next/server';
import { getFacilitySuggestions } from '@/lib/search/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: '/api/search/suggestions'
      },
      message: 'Search suggestions API called',
    });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const size = parseInt(searchParams.get('size') || '5');

    if (!query.trim()) {
      return Response.json({ 
        query: '',
        suggestions: [] 
      });
    }

    const results = await getFacilitySuggestions(query, size);

    if (!results.success) {
      globalThis?.logger?.error({
        err: results.error,
        meta: {
          query,
          size
        },
        message: 'Failed to get facility suggestions',
      });

      return Response.json(
        { error: 'Failed to get suggestions', details: results.error },
        { status: 500 }
      );
    }

    globalThis?.logger?.info({
      meta: {
        query,
        size,
        resultsCount: results.suggestions.length
      },
      message: 'Search suggestions returned successfully',
    });

    return Response.json({
      query,
      suggestions: results.suggestions
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Suggestions API error',
    });

    console.error('Suggestions API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}