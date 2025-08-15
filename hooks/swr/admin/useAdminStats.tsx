import useSWR from "swr";

interface AdminStats {
  totalUsers: number;
  totalFacilities: number;
  activeBookings: number;
  activeCourts: number;
  userGrowth: number;
  facilityGrowth: number;
  bookingGrowth: number;
  courtGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<AdminStats>(
    "/api/admin/stats",
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
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
