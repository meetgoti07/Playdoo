import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface VenueDetails {
  id: string;
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
    id: string;
    name?: string;
    sportType: string;
    pricePerHour: number;
    isActive: boolean;
    description?: string;
    capacity?: number;
    length?: number;
    width?: number;
  }>;
  amenities: Array<{
    id: string;
    name: string;
    icon?: string;
    category?: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  operatingHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSlot {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  status: string;
}

export function useVenueDetails(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{ venue: VenueDetails }>(
    id ? `/api/venues/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    venue: data?.venue,
    isLoading,
    error,
    mutate,
  };
}

export function useVenueAvailability(hashId: string, date?: string, sportType?: string) {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (sportType) params.append('sportType', sportType);
  
  const queryString = params.toString();
  const url = hashId ? `/api/venues/${hashId}/availability${queryString ? `?${queryString}` : ''}` : null;

  const { data, error, isLoading, mutate } = useSWR<{ slots: BookingSlot[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    slots: data?.slots || [],
    isLoading,
    error,
    mutate,
  };
}

export interface VenueReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  sportType?: string;
  createdAt: string;
  isVerified: boolean;
}

export function useVenueReviews(hashId: string, page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<{
    reviews: VenueReview[];
    total: number;
    average: number;
    pagination: {
      current_page: number;
      per_page: number;
      total_pages: number;
    };
  }>(
    hashId ? `/api/venues/${hashId}/reviews?page=${page}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    reviews: data?.reviews || [],
    total: data?.total || 0,
    average: data?.average || 0,
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

export interface SimilarVenue {
  hashId: string;
  name: string;
  city: string;
  state: string;
  rating?: number;
  totalReviews: number;
  venueType: string;
  courts: Array<{
    sportType: string;
    pricePerHour: number;
  }>;
  photos: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  distance?: number;
}

export function useSimilarVenues(hashId: string, limit: number = 6) {
  const { data, error, isLoading } = useSWR<{ venues: SimilarVenue[] }>(
    hashId ? `/api/venues/${hashId}/similar?limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // 10 minutes
    }
  );

  return {
    venues: data?.venues || [],
    isLoading,
    error,
  };
}
