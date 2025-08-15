import { NextRequest } from 'next/server';
import { searchProducts } from '@/lib/search/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const size = parseInt(searchParams.get('size') || '10');
    const from = parseInt(searchParams.get('from') || '0');
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : undefined;

    if (!query.trim()) {
      return Response.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const results = await searchProducts(query, {
      size,
      from,
      category,
      brand,
      tags,
      minPrice,
      maxPrice,
      inStock
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
    console.error('Product search API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
