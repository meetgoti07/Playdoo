import useSWR from "swr";

export interface Analytics {
  overview: {
    totalUsers: number;
    totalFacilities: number;
    totalBookings: number;
    totalRevenue: number;
    userGrowth: number;
    facilityGrowth: number;
    bookingGrowth: number;
    revenueGrowth: number;
  };
  userStats: any[];
  bookingStats: any[];
  revenueStats: any[];
  facilityStats: any[];
  topCities: any[];
  recentActivities: any[];
  charts: {
    timeline: any[];
    userGrowth: any[];
    userTypes: any[];
    bookingTrends: any[];
    bookingStatus: any[];
    revenue: any[];
    revenueSources: any[];
    facilityPerformance: any[];
    facilityTypes: any[];
  };
}

export interface UseAnalyticsParams {
  period?: string;
  startDate?: Date;
  endDate?: Date;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAnalytics(params?: UseAnalyticsParams) {
  const queryParams = new URLSearchParams();
  
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate.toISOString());
  if (params?.endDate) queryParams.append("endDate", params.endDate.toISOString());

  const { data, error, isLoading, mutate } = useSWR<Analytics>(
    `/api/admin/analytics?${queryParams.toString()}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
