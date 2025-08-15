import { NextRequest } from 'next/server';
import { indexDocument, bulkIndexDocuments, SearchDocument } from '@/lib/search/elasticsearch';

// Index single document
export async function POST(request: NextRequest) {
  try {
    const document: SearchDocument = await request.json();
    
    const result = await indexDocument(document);
    
    if (!result.success) {
      return Response.json(
        { error: 'Failed to index document', details: result.error },
        { status: 500 }
      );
    }

    return Response.json({ success: true, message: 'Document indexed successfully' });
  } catch (error) {
    console.error('Index API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk index documents
export async function PUT(request: NextRequest) {
  try {
    const { documents }: { documents: SearchDocument[] } = await request.json();
    
    if (!Array.isArray(documents) || documents.length === 0) {
      return Response.json(
        { error: 'Documents array is required' },
        { status: 400 }
      );
    }

    const result = await bulkIndexDocuments(documents);
    
    if (!result.success) {
      return Response.json(
        { error: 'Failed to bulk index documents', details: result.error },
        { status: 500 }
      );
    }

    return Response.json({ 
      success: true, 
      message: `${documents.length} documents indexed successfully` 
    });
  } catch (error) {
    console.error('Bulk index API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}