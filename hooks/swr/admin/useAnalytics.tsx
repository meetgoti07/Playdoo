import useSWR from "swr";

interface UseAnalyticsParams {
  dateRange?: string;
  type?: string;
}

interface Analytics {
  totalRevenue: number;
  activeUsers: number;
  activeFacilities: number;
  totalBookings: number;
  revenueGrowth: number;
  userGrowth: number;
  facilityGrowth: number;
  bookingGrowth: number;
  avgBookingValue: number;
  completionRate: number;
  cancellationRate: number;
  topSports: Array<{ name: string; bookings: number }>;
  topCities: Array<{ name: string; facilities: number }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAnalytics(params: UseAnalyticsParams = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.dateRange) searchParams.set("dateRange", params.dateRange);
  if (params.type) searchParams.set("type", params.type);

  const { data, error, isLoading, mutate } = useSWR<Analytics>(
    `/api/admin/analytics?${searchParams.toString()}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
