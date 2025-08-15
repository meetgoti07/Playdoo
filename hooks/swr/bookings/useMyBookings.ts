import useSWR from 'swr';
import { BookingStatus } from '@/lib/generated/prisma';

interface BookingFilters {
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface BookingWithDetails {
  id: string;
  hashId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  pricePerHour: number;
  totalAmount: number;
  platformFee: number;
  tax: number;
  finalAmount: number;
  status: BookingStatus;
  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  noShowAt?: string;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    rating?: number;
  };
  court: {
    id: string;
    name: string;
    sportType: string;
    pricePerHour: number;
  };
  payment?: {
    id: string;
    amount: number;
    platformFee: number;
    tax: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
    createdAt: string;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
}

interface BookingsResponse {
  bookings: BookingWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const fetcher = async (url: string): Promise<BookingsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return response.json();
};

export function useMyBookings(filters: BookingFilters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());

  const url = `/api/bookings/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });

  return {
    bookings: data?.bookings || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    isLoading,
    error,
    mutate,
  };
}

export function useBookingStats() {
  const { data, error, isLoading } = useSWR('/api/bookings/stats', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30000, // 30 seconds
  });

  return {
    stats: data || {
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
    },
    isLoading,
    error,
  };
}
