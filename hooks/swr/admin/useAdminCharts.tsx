import useSWR from "swr";

interface BookingTrendData {
  month: string;
  bookings: number;
}

interface UserRegistrationData {
  month: string;
  users: number;
}

interface SportPopularityData {
  name: string;
  bookings: number;
}

interface RevenueTrendData {
  month: string;
  revenue: number;
}

interface FacilityApprovalData {
  month: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface AdminChartData {
  bookingTrend: BookingTrendData[];
  userRegistrationTrend: UserRegistrationData[];
  sportPopularity: SportPopularityData[];
  revenueTrend: RevenueTrendData[];
  facilityApprovalTrend: FacilityApprovalData[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAdminCharts() {
  const { data, error, isLoading, mutate } = useSWR<AdminChartData>(
    "/api/admin/charts",
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
