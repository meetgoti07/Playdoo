import useSWR from "swr";

interface UserAnalyticsData {
  user: {
    id: string;
    hashId: number;
    name: string;
    email: string;
    image?: string;
    phone?: string;
    role?: string;
    status?: string;
    city?: string;
    state?: string;
    dateOfBirth?: string;
    createdAt: string;
    updatedAt: string;
    emailVerified?: string | null;
  };
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    favoriteSport: string;
    favoriteFacility: string;
    bookingFrequency: number; // bookings per month
  };
  bookingTrend: Array<{
    month: string;
    bookings: number;
    amount: number;
  }>;
  sportPreference: Array<{
    sport: string;
    bookings: number;
    percentage: number;
  }>;
  facilityUsage: Array<{
    facilityName: string;
    bookings: number;
    lastBooked: string;
  }>;
  timePreference: Array<{
    hour: number;
    bookings: number;
  }>;
  recentBookings: Array<{
    id: string;
    facilityName: string;
    courtName: string;
    sportType: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    amount: number;
  }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserAnalytics(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<UserAnalyticsData>(
    userId ? `/api/admin/users/${userId}/analytics` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.user,
    stats: data?.stats,
    bookingTrend: data?.bookingTrend,
    sportPreference: data?.sportPreference,
    facilityUsage: data?.facilityUsage,
    timePreference: data?.timePreference,
    recentBookings: data?.recentBookings,
    error,
    isLoading,
    mutate,
  };
}
