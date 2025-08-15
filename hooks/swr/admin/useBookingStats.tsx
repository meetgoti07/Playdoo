import useSWR from "swr";

interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  activeUsers: number;
  avgSessionDuration: number;
  completionRate: number;
  bookingGrowth: number;
  confirmedGrowth: number;
  pendingGrowth: number;
  revenueGrowth: number;
  activeUserGrowth: number;
  sessionGrowth: number;
  cancellationRate: number;
  completionGrowth: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBookingStats() {
  const { data, error, isLoading, mutate } = useSWR<BookingStats>(
    "/api/admin/bookings/stats",
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
