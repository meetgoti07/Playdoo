import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface VenueReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  sportType?: string;
  courtName?: string;
  bookingDate: string;
  createdAt: string;
  isVerified: boolean;
}

export interface ReviewStats {
  total: number;
  average: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface EligibleBooking {
  id: string;
  bookingDate: string;
  court: {
    id: string;
    name: string;
    sportType: string;
  };
  completedAt: string;
}

export interface ExistingReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  booking: {
    id: string;
    court: {
      name: string;
      sportType: string;
    };
    bookingDate: string;
  };
}

export function useVenueReviews(venueId: string, page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<{
    reviews: VenueReview[];
    total: number;
    average: number;
    ratingDistribution: ReviewStats['ratingDistribution'];
    pagination: {
      current_page: number;
      per_page: number;
      total_pages: number;
      total_count: number;
    };
  }>(
    venueId ? `/api/venues/${venueId}/reviews?page=${page}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    reviews: data?.reviews || [],
    stats: data ? {
      total: data.total,
      average: data.average,
      ratingDistribution: data.ratingDistribution,
    } : null,
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

export function useUserReviewEligibility(venueId: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    canReview: boolean;
    eligibleBookings: EligibleBooking[];
    existingReviews: ExistingReview[];
  }>(
    venueId ? `/api/venues/${venueId}/can-review` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    canReview: data?.canReview || false,
    eligibleBookings: data?.eligibleBookings || [],
    existingReviews: data?.existingReviews || [],
    isLoading,
    error,
    mutate,
  };
}

export async function submitVenueReview(
  venueId: string,
  bookingId: string,
  rating: number,
  comment?: string
) {
  const response = await fetch(`/api/venues/${venueId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bookingId,
      rating,
      comment,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit review');
  }

  return response.json();
}
