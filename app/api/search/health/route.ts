import { NextRequest } from 'next/server';
import { Client } from '@elastic/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    const client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });

    // Test connection
    const health = await client.cluster.health();
    
    return Response.json({
      success: true,
      message: 'Elasticsearch connection successful',
      cluster: {
        status: health.status,
        cluster_name: health.cluster_name,
        number_of_nodes: health.number_of_nodes
      }
    });

  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    return Response.json(
      { 
        success: false,
        error: 'Failed to connect to Elasticsearch', 
        details: error instanceof Error ? error.message : 'Unknown error',
        elasticsearch_url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      },
      { status: 500 }
    );
  }
}
