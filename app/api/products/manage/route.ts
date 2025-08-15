import { NextRequest } from 'next/server';
import { indexProduct, deleteProduct, initializeIndices, bulkIndexProducts } from '@/lib/search/elasticsearch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, product, products } = body;

    switch (action) {
      case 'index':
        if (!product) {
          return Response.json({ error: 'Product data is required' }, { status: 400 });
        }
        const indexResult = await indexProduct(product);
        return Response.json(indexResult);

      case 'bulk_index':
        if (!products || !Array.isArray(products)) {
          return Response.json({ error: 'Products array is required' }, { status: 400 });
        }
        const bulkResult = await bulkIndexProducts(products);
        return Response.json(bulkResult);

      case 'init_indices':
        await initializeIndices();
        return Response.json({ success: true, message: 'Indices initialized' });

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Product management API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const result = await deleteProduct(id);
    return Response.json(result);
  } catch (error) {
    console.error('Product delete API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
