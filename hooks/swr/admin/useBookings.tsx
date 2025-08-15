import useSWR from "swr";

interface UseBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateRange?: string;
}

interface Booking {
  id: string;
  hashId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  pricePerHour: number;
  finalAmount: number;
  status: string;
  user: {
    name: string;
    email: string;
    image?: string;
  };
  facility: {
    name: string;
  };
  court: {
    name: string;
    sportType: string;
  };
  payment?: {
    status: string;
  };
}

interface BookingsResponse {
  bookings: Booking[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBookings(params: UseBookingsParams = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.dateRange) searchParams.set("dateRange", params.dateRange);

  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(
    `/api/admin/bookings?${searchParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
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
