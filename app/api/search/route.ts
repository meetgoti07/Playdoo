import { NextRequest } from 'next/server';
import { searchDocuments } from '@/lib/search/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const size = parseInt(searchParams.get('size') || '10');
    const from = parseInt(searchParams.get('from') || '0');
    const category = searchParams.get('category') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;

    if (!query.trim()) {
      return Response.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const results = await searchDocuments(query, {
      size,
      from,
      category,
      tags
    });

    if (!results.success) {
      return Response.json(
        { error: 'Search failed', details: results.error },
        { status: 500 }
      );
    }

    return Response.json({
      query,
      results: results.results,
      total: results.total,
      took: results.took,
      pagination: {
        current_page: Math.floor(from / size) + 1,
        per_page: size,
        total_pages: Math.ceil((results.total as any)?.value || 0 / size)
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}