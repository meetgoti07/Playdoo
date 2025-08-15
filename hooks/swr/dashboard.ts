import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
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
    caption?: string;
  }>;
}

export interface Sport {
  sportType: string;
  venueCount: number;
  averagePrice: number;
  facilities: Array<{
    id: string;
    name: string;
    city: string;
    rating?: number;
    photos: Array<{
      url: string;
    }>;
  }>;
}

export interface VenueCategory {
  title: string;
  description: string;
  venues: Venue[];
}

export interface CityGroup {
  city: string;
  venueCount: number;
  venues: Array<{
    id: string;
    name: string;
    city: string;
    rating?: number;
    photos: Array<{
      url: string;
    }>;
  }>;
}

export function useDashboardBanners() {
  const { data, error, isLoading } = useSWR<{ banners: Banner[] }>(
    '/api/dashboard/banners',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    banners: data?.banners || [],
    isLoading,
    error,
  };
}

export function usePopularVenues() {
  const { data, error, isLoading } = useSWR<{ venues: Venue[] }>(
    '/api/dashboard/popular-venues',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    venues: data?.venues || [],
    isLoading,
    error,
  };
}

export function usePopularSports() {
  const { data, error, isLoading } = useSWR<{ sports: Sport[] }>(
    '/api/dashboard/popular-sports',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    sports: data?.sports || [],
    isLoading,
    error,
  };
}

export function useVenuesByCategory(city?: string) {
  const url = city 
    ? `/api/dashboard/venues-by-category?city=${encodeURIComponent(city)}`
    : '/api/dashboard/venues-by-category';

  const { data, error, isLoading } = useSWR<{
    categories: VenueCategory[];
    cities: CityGroup[];
  }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    categories: data?.categories || [],
    cities: data?.cities || [],
    isLoading,
    error,
  };
}

export interface Deal {
  id: string;
  facilityId: string;
  facility: {
    id: string;
    name: string;
    city: string;
    state: string;
    rating?: number;
    photos: Array<{ url: string; isPrimary: boolean }>;
    courts: Array<{
      sportType: string;
      pricePerHour: number;
    }>;
  };
  title: string;
  description: string;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  maxBookings?: number;
  usedBookings?: number;
}

export function useFeaturedDeals() {
  const { data, error, isLoading } = useSWR<{ deals: Deal[] }>(
    '/api/dashboard/featured-deals',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    deals: data?.deals || [],
    isLoading,
    error,
  };
}
