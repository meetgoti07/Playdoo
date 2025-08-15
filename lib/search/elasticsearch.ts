// lib/elasticsearch.ts
import { Client } from '@elastic/elasticsearch';

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

// Define your document interfaces
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  tags: string[];
  sku: string;
  inStock: boolean;
  imageUrl?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: string;
  hashId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  website?: string;
  venueType: string;
  rating?: number;
  totalReviews: number;
  isActive: boolean;
  courts: Array<{
    sportType: string;
    pricePerHour: number;
    isActive: boolean;
  }>;
  amenities: Array<{
    name: string;
    icon?: string;
  }>;
  photos: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Index configuration
const INDEX_NAME = 'website_content';
const PRODUCTS_INDEX = 'products';
const FACILITIES_INDEX = 'facilities';

// Create index with mapping
export async function createIndex() {
  try {
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    if (!indexExists) {
      await client.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                completion: {
                  type: 'completion'
                }
              }
            },
            content: { 
              type: 'text',
              analyzer: 'standard'
            },
            category: { type: 'keyword' },
            tags: { type: 'keyword' },
            url: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        },
        settings: {
          analysis: {
            analyzer: {
              custom_analyzer: {
                type: 'standard',
                stopwords: '_english_'
              }
            }
          }
        }
      });
      console.log(`Index ${INDEX_NAME} created successfully`);
    }
  } catch (error) {
    console.error('Error creating index:', error);
  }
}

// Create products index with mapping
export async function createProductsIndex() {
  try {
    const indexExists = await client.indices.exists({ index: PRODUCTS_INDEX });
    
    if (!indexExists) {
      await client.indices.create({
        index: PRODUCTS_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                completion: {
                  type: 'completion'
                }
              }
            },
            description: { 
              type: 'text',
              analyzer: 'standard'
            },
            price: { type: 'float' },
            category: { type: 'keyword' },
            brand: { type: 'keyword' },
            tags: { type: 'keyword' },
            sku: { type: 'keyword' },
            inStock: { type: 'boolean' },
            imageUrl: { type: 'keyword' },
            rating: { type: 'float' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        },
        settings: {
          analysis: {
            analyzer: {
              product_analyzer: {
                type: 'standard',
                stopwords: '_english_'
              }
            }
          }
        }
      });
      console.log(`Index ${PRODUCTS_INDEX} created successfully`);
    }
  } catch (error) {
    console.error('Error creating products index:', error);
  }
}

// Create facilities index with mapping
export async function createFacilitiesIndex() {
  try {
    const indexExists = await client.indices.exists({ index: FACILITIES_INDEX });
    
    if (!indexExists) {
      await client.indices.create({
        index: FACILITIES_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            hashId: { type: 'keyword' },
            name: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                completion: {
                  type: 'completion'
                }
              }
            },
            description: { 
              type: 'text',
              analyzer: 'standard'
            },
            address: { type: 'text' },
            city: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            state: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            country: { type: 'keyword' },
            pincode: { type: 'keyword' },
            location: { type: 'geo_point' },
            phone: { type: 'keyword' },
            email: { type: 'keyword' },
            website: { type: 'keyword' },
            venueType: { type: 'keyword' },
            rating: { type: 'float' },
            totalReviews: { type: 'integer' },
            isActive: { type: 'boolean' },
            courts: {
              type: 'nested',
              properties: {
                sportType: { type: 'keyword' },
                pricePerHour: { type: 'float' },
                isActive: { type: 'boolean' }
              }
            },
            amenities: {
              type: 'nested',
              properties: {
                name: { type: 'keyword' },
                icon: { type: 'keyword' }
              }
            },
            photos: {
              type: 'nested',
              properties: {
                url: { type: 'keyword' },
                isPrimary: { type: 'boolean' }
              }
            },
            sportTypes: { type: 'keyword' }, // Flattened for easier filtering
            amenityNames: { type: 'keyword' }, // Flattened for easier filtering
            minPrice: { type: 'float' },
            maxPrice: { type: 'float' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        },
        settings: {
          analysis: {
            analyzer: {
              facility_analyzer: {
                type: 'standard',
                stopwords: '_english_'
              }
            }
          }
        }
      });
      console.log(`Index ${FACILITIES_INDEX} created successfully`);
    }
  } catch (error) {
    console.error('Error creating facilities index:', error);
  }
}

// Index a document
export async function indexDocument(doc: SearchDocument) {
  try {
    const { id, ...docBody } = doc;
    await client.index({
      index: INDEX_NAME,
      id: id,
      document: docBody
    });
    
    // Refresh index to make document searchable immediately
    await client.indices.refresh({ index: INDEX_NAME });
    
    return { success: true };
  } catch (error) {
    console.error('Error indexing document:', error);
    return { success: false, error };
  }
}

// Index a product
export async function indexProduct(product: Product) {
  try {
    const { id, ...productBody } = product;
    await client.index({
      index: PRODUCTS_INDEX,
      id: id,
      document: productBody
    });
    
    // Refresh index to make document searchable immediately
    await client.indices.refresh({ index: PRODUCTS_INDEX });
    
    return { success: true };
  } catch (error) {
    console.error('Error indexing product:', error);
    return { success: false, error };
  }
}

// Index a facility
export async function indexFacility(facility: Facility) {
  try {
    const { id, ...facilityBody } = facility;
    
    // Add derived fields for easier searching
    const facilityWithDerived = {
      ...facilityBody,
      location: facility.latitude && facility.longitude ? {
        lat: facility.latitude,
        lon: facility.longitude
      } : undefined,
      sportTypes: facility.courts.map(c => c.sportType),
      amenityNames: facility.amenities.map(a => a.name),
      minPrice: Math.min(...facility.courts.filter(c => c.isActive).map(c => c.pricePerHour)),
      maxPrice: Math.max(...facility.courts.filter(c => c.isActive).map(c => c.pricePerHour))
    };
    
    await client.index({
      index: FACILITIES_INDEX,
      id: id,
      document: facilityWithDerived
    });
    
    // Refresh index to make document searchable immediately
    await client.indices.refresh({ index: FACILITIES_INDEX });
    
    return { success: true };
  } catch (error) {
    console.error('Error indexing facility:', error);
    return { success: false, error };
  }
}

// Bulk index documents
export async function bulkIndexDocuments(documents: SearchDocument[]) {
  try {
    const body = documents.flatMap(doc => {
      const { id, ...docBody } = doc;
      return [
        { index: { _index: INDEX_NAME, _id: id } },
        docBody
      ];
    });

    const response = await client.bulk({ operations: body });
    
    if (response.errors) {
      console.error('Bulk indexing errors:', response.items);
    }
    
    await client.indices.refresh({ index: INDEX_NAME });
    
    return { success: !response.errors, response };
  } catch (error) {
    console.error('Error bulk indexing:', error);
    return { success: false, error };
  }
}

// Bulk index products
export async function bulkIndexProducts(products: Product[]) {
  try {
    const body = products.flatMap(product => {
      const { id, ...productBody } = product;
      return [
        { index: { _index: PRODUCTS_INDEX, _id: id } },
        productBody
      ];
    });

    const response = await client.bulk({ operations: body });
    
    if (response.errors) {
      console.error('Bulk indexing errors:', response.items);
    }
    
    await client.indices.refresh({ index: PRODUCTS_INDEX });
    
    return { success: !response.errors, response };
  } catch (error) {
    console.error('Error bulk indexing products:', error);
    return { success: false, error };
  }
}

// Bulk index facilities
export async function bulkIndexFacilities(facilities: Facility[]) {
  try {
    const body = facilities.flatMap(facility => {
      const { id, ...facilityBody } = facility;
      
      // Add derived fields
      const facilityWithDerived = {
        ...facilityBody,
        location: facility.latitude && facility.longitude ? {
          lat: facility.latitude,
          lon: facility.longitude
        } : undefined,
        sportTypes: facility.courts.map(c => c.sportType),
        amenityNames: facility.amenities.map(a => a.name),
        minPrice: facility.courts.length > 0 ? Math.min(...facility.courts.filter(c => c.isActive).map(c => c.pricePerHour)) : 0,
        maxPrice: facility.courts.length > 0 ? Math.max(...facility.courts.filter(c => c.isActive).map(c => c.pricePerHour)) : 0
      };
      
      return [
        { index: { _index: FACILITIES_INDEX, _id: id } },
        facilityWithDerived
      ];
    });

    const response = await client.bulk({ operations: body });
    
    if (response.errors) {
      console.error('Bulk indexing errors:', response.items);
    }
    
    await client.indices.refresh({ index: FACILITIES_INDEX });
    
    return { success: !response.errors, response };
  } catch (error) {
    console.error('Error bulk indexing facilities:', error);
    return { success: false, error };
  }
}

// Search documents
export async function searchDocuments(
  query: string,
  options: {
    size?: number;
    from?: number;
    category?: string;
    tags?: string[];
  } = {}
) {
  try {
    const { size = 10, from = 0, category, tags } = options;
    
    const searchBody: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['title^3', 'content^2', 'tags^2'],
                type: 'best_fields',
                fuzziness: 'AUTO',
                operator: 'or'
              }
            }
          ],
          filter: []
        }
      },
      highlight: {
        fields: {
          title: {},
          content: {
            fragment_size: 150,
            number_of_fragments: 2
          }
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      },
      size,
      from
    };

    // Add category filter
    if (category) {
      searchBody.query.bool.filter.push({
        term: { category }
      });
    }

    // Add tags filter
    if (tags && tags.length > 0) {
      searchBody.query.bool.filter.push({
        terms: { tags }
      });
    }

    const response = await client.search({
      index: INDEX_NAME,
      ...searchBody
    });

    return {
      success: true,
      results: response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight
      })),
      total: response.hits.total,
      took: response.took
    };
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, error };
  }
}

// Search products
export async function searchProducts(
  query: string,
  options: {
    size?: number;
    from?: number;
    category?: string;
    brand?: string;
    tags?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  } = {}
) {
  try {
    const { size = 10, from = 0, category, brand, tags, minPrice, maxPrice, inStock } = options;
    
    const searchBody: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'description^2', 'tags^2', 'brand^1.5'],
                type: 'best_fields',
                fuzziness: 'AUTO',
                operator: 'or'
              }
            }
          ],
          filter: []
        }
      },
      highlight: {
        fields: {
          name: {},
          description: {
            fragment_size: 150,
            number_of_fragments: 2
          }
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      },
      sort: [
        { _score: { order: 'desc' } },
        { rating: { order: 'desc', missing: '_last' } }
      ],
      size,
      from
    };

    // Add filters
    if (category) {
      searchBody.query.bool.filter.push({
        term: { category }
      });
    }

    if (brand) {
      searchBody.query.bool.filter.push({
        term: { brand }
      });
    }

    if (tags && tags.length > 0) {
      searchBody.query.bool.filter.push({
        terms: { tags }
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      
      searchBody.query.bool.filter.push({
        range: { price: priceRange }
      });
    }

    if (inStock !== undefined) {
      searchBody.query.bool.filter.push({
        term: { inStock }
      });
    }

    const response = await client.search({
      index: PRODUCTS_INDEX,
      ...searchBody
    });

    return {
      success: true,
      results: response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight
      })),
      total: response.hits.total,
      took: response.took
    };
  } catch (error) {
    console.error('Search products error:', error);
    return { success: false, error };
  }
}

// Search facilities
export async function searchFacilities(
  query: string,
  options: {
    size?: number;
    from?: number;
    state?: string;
    city?: string;
    sport?: string;
    venueType?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    amenities?: string[];
    latitude?: number;
    longitude?: number;
    radius?: string;
  } = {}
) {
  try {
    const { 
      size = 10, 
      from = 0, 
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
      radius = '25km'
    } = options;
    
    const searchBody: any = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: []
        }
      },
      highlight: {
        fields: {
          name: {},
          description: {
            fragment_size: 150,
            number_of_fragments: 2
          },
          'city': {},
          'address': {}
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>']
      },
      sort: [
        { _score: { order: 'desc' } },
        { rating: { order: 'desc', missing: '_last' } }
      ],
      size,
      from,
      aggs: {
        cities: {
          terms: { field: 'city.keyword', size: 20 }
        },
        sports: {
          terms: { field: 'sportTypes', size: 20 }
        },
        venueTypes: {
          terms: { field: 'venueType', size: 10 }
        },
        priceRanges: {
          histogram: {
            field: 'minPrice',
            interval: 500,
            min_doc_count: 1
          }
        }
      }
    };

    // Main search query
    if (query && query !== '*') {
      searchBody.query.bool.must.push({
        multi_match: {
          query,
          fields: [
            'name^4', 
            'description^2', 
            'city^3', 
            'state^2', 
            'address^1.5',
            'sportTypes^2',
            'amenityNames^1.5'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or'
        }
      });
    } else {
      searchBody.query.bool.must.push({
        match_all: {}
      });
    }

    // Only show active facilities
    searchBody.query.bool.filter.push({
      term: { isActive: true }
    });

    // State filter
    if (state) {
      searchBody.query.bool.filter.push({
        term: {
          'state.keyword': state
        }
      });
    }

    // City filter
    if (city) {
      searchBody.query.bool.filter.push({
        term: {
          'city.keyword': city
        }
      });
    }

    // Geo-distance filter
    if (latitude && longitude) {
      searchBody.query.bool.filter.push({
        geo_distance: {
          distance: radius,
          location: {
            lat: latitude,
            lon: longitude
          }
        }
      });
      
      // Add distance sorting
      searchBody.sort.unshift({
        _geo_distance: {
          location: {
            lat: latitude,
            lon: longitude
          },
          order: 'asc',
          unit: 'km'
        }
      });
    }

    // Sport filter
    if (sport) {
      searchBody.query.bool.filter.push({
        nested: {
          path: 'courts',
          query: {
            bool: {
              must: [
                { term: { 'courts.sportType': sport } },
                { term: { 'courts.isActive': true } }
              ]
            }
          }
        }
      });
    }

    // Venue type filter
    if (venueType) {
      searchBody.query.bool.filter.push({
        term: { venueType }
      });
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery: any = {
        nested: {
          path: 'courts',
          query: {
            bool: {
              must: [
                { term: { 'courts.isActive': true } }
              ]
            }
          }
        }
      };

      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceRange: any = {};
        if (minPrice !== undefined) priceRange.gte = minPrice;
        if (maxPrice !== undefined) priceRange.lte = maxPrice;
        
        priceQuery.nested.query.bool.must.push({
          range: { 'courts.pricePerHour': priceRange }
        });
      }

      searchBody.query.bool.filter.push(priceQuery);
    }

    // Rating filter
    if (rating) {
      searchBody.query.bool.filter.push({
        range: { rating: { gte: rating } }
      });
    }

    // Amenities filter
    if (amenities && amenities.length > 0) {
      searchBody.query.bool.filter.push({
        terms: { amenityNames: amenities }
      });
    }

    const response = await client.search({
      index: FACILITIES_INDEX,
      ...searchBody
    });

    return {
      success: true,
      results: response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        distance: hit.sort && hit.sort[0] !== hit._score ? hit.sort[0] : undefined,
        ...hit._source,
        highlights: hit.highlight
      })),
      total: response.hits.total,
      took: response.took,
      aggregations: response.aggregations
    };
  } catch (error) {
    console.error('Search facilities error:', error);
    return { success: false, error };
  }
}

// Get suggestions (autocomplete)
export async function getSuggestions(query: string, size: number = 5) {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      suggest: {
        title_suggest: {
          prefix: query,
          completion: {
            field: 'title.completion',
            size
          }
        }
      },
      _source: false
    });

    return {
      success: true,
      suggestions: response.suggest?.title_suggest?.[0]?.options || []
    };
  } catch (error) {
    console.error('Suggestions error:', error);
    return { success: false, error };
  }
}

// Get product suggestions (autocomplete)
export async function getProductSuggestions(query: string, size: number = 5) {
  try {
    const response = await client.search({
      index: PRODUCTS_INDEX,
      suggest: {
        name_suggest: {
          prefix: query,
          completion: {
            field: 'name.completion',
            size
          }
        }
      },
      _source: false
    });

    return {
      success: true,
      suggestions: response.suggest?.name_suggest?.[0]?.options || []
    };
  } catch (error) {
    console.error('Product suggestions error:', error);
    return { success: false, error };
  }
}

// Get facility suggestions (autocomplete)
export async function getFacilitySuggestions(query: string, size: number = 5) {
  try {
    // Get facility name suggestions
    const facilityResponse = await client.search({
      index: FACILITIES_INDEX,
      size: Math.ceil(size / 2),
      query: {
        bool: {
          should: [
            {
              match: {
                'name': {
                  query,
                  fuzziness: 'AUTO'
                }
              }
            },
            {
              prefix: {
                'name.keyword': query
              }
            }
          ]
        }
      },
      _source: ['name', 'city', 'state', 'hashId']
    });

    // Get location suggestions
    const locationResponse = await client.search({
      index: FACILITIES_INDEX,
      size: 0,
      query: {
        bool: {
          should: [
            {
              match: {
                'city': {
                  query,
                  fuzziness: 'AUTO'
                }
              }
            },
            {
              match: {
                'state': {
                  query,
                  fuzziness: 'AUTO'
                }
              }
            }
          ]
        }
      },
      aggs: {
        cities: {
          terms: {
            field: 'city.keyword',
            size: 5
          }
        },
        states: {
          terms: {
            field: 'state.keyword',
            size: 3
          }
        }
      }
    });

    const facilityHits = facilityResponse.hits.hits as any[];
    const cityBuckets = (locationResponse.aggregations?.cities as any)?.buckets || [];
    const stateBuckets = (locationResponse.aggregations?.states as any)?.buckets || [];

    const suggestions = [
      ...facilityHits.map((hit: any) => ({
        type: 'facility',
        name: hit._source?.name || '',
        id: hit._source?.hashId || hit._id,
        subtitle: hit._source ? `${hit._source.city}, ${hit._source.state}` : undefined,
        text: hit._source?.name || ''
      })),
      ...cityBuckets.map((bucket: any) => ({
        type: 'location',
        name: bucket.key,
        id: bucket.key,
        subtitle: `${bucket.doc_count} facilities`,
        text: bucket.key
      })),
      ...stateBuckets.map((bucket: any) => ({
        type: 'location',
        name: bucket.key,
        id: bucket.key,
        subtitle: `${bucket.doc_count} facilities`,
        text: bucket.key
      }))
    ];

    return {
      success: true,
      suggestions: suggestions.slice(0, size)
    };
  } catch (error) {
    console.error('Facility suggestions error:', error);
    return { success: false, error };
  }
}

// Delete document
export async function deleteDocument(id: string) {
  try {
    await client.delete({
      index: INDEX_NAME,
      id
    });
    
    await client.indices.refresh({ index: INDEX_NAME });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error };
  }
}

// Delete product
export async function deleteProduct(id: string) {
  try {
    await client.delete({
      index: PRODUCTS_INDEX,
      id
    });
    
    await client.indices.refresh({ index: PRODUCTS_INDEX });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error };
  }
}

// Delete facility
export async function deleteFacility(id: string) {
  try {
    await client.delete({
      index: FACILITIES_INDEX,
      id
    });
    
    await client.indices.refresh({ index: FACILITIES_INDEX });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting facility:', error);
    return { success: false, error };
  }
}

// Database sync functions
export async function syncProductToElasticsearch(operation: 'create' | 'update' | 'delete', product: Product | { id: string }) {
  try {
    switch (operation) {
      case 'create':
      case 'update':
        if ('name' in product) {
          return await indexProduct(product);
        }
        break;
      case 'delete':
        return await deleteProduct(product.id);
    }
    return { success: false, error: 'Invalid operation or product data' };
  } catch (error) {
    console.error('Error syncing product to Elasticsearch:', error);
    return { success: false, error };
  }
}

// Facility sync function
export async function syncFacilityToElasticsearch(operation: 'create' | 'update' | 'delete', facility: Facility | { id: string }) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        operation,
        facilityId: facility.id
      },
      message: `Syncing facility to Elasticsearch: ${operation}`,
    });

    switch (operation) {
      case 'create':
      case 'update':
        if ('name' in facility) {
          return await indexFacility(facility);
        }
        break;
      case 'delete':
        return await deleteFacility(facility.id);
    }
    return { success: false, error: 'Invalid operation or facility data' };
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        operation,
        facilityId: facility.id
      },
      message: 'Error syncing facility to Elasticsearch',
    });
    console.error('Error syncing facility to Elasticsearch:', error);
    return { success: false, error };
  }
}

// Initialize indices
export async function initializeIndices() {
  await createIndex();
  await createProductsIndex();
  await createFacilitiesIndex();
}

export { client };
export default client;