import useSWR from 'swr';

export interface VenueFilters {
  page?: number;
  limit?: number;
  city?: string;
  state?: string;
  sportType?: string;
  venueType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sortBy?: 'name' | 'rating' | 'price' | 'reviews' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface Venue {
  id: string;
  name: string;
  description: string | null;
  city: string;
  state: string;
  rating: number;
  totalReviews: number;
  venueType: string;
  createdAt: string;
  minPrice: number;
  maxPrice: number;
  sportTypes: string[];
  primaryPhoto: string | null;
  amenities: {
    id: string;
    name: string;
    icon: string;
  }[];
}

export interface VenuesPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

export interface VenuesFiltersOptions {
  cities: string[];
  states: string[];
  priceRange: {
    min: number;
    max: number;
  };
  sportTypes: string[];
  venueTypes: string[];
}

export interface VenuesResponse {
  venues: Venue[];
  pagination: VenuesPagination;
  filters: VenuesFiltersOptions;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useVenues(filters: VenueFilters = {}) {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  const url = `/api/venues${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<VenuesResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    venues: data?.venues || [],
    pagination: data?.pagination,
    filterOptions: data?.filters,
    isLoading,
    error,
    mutate,
  };
}

// Hook for getting venue details (reuse existing)
export function useVenueDetails(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/venues/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    venue: data?.venue,
    isLoading,
    error,
    mutate,
  };
}
