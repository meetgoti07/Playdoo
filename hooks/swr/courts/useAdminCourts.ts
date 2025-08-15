import useSWR from 'swr';

interface UseAdminCourtsParams {
  search?: string;
  sportType?: string;
  isActive?: boolean;
  facilityId?: string;
  page?: number;
  limit?: number;
}

interface AdminCourt {
  id: string;
  hashId: number;
  name: string;
  sportType: string;
  description?: string;
  pricePerHour: number;
  capacity?: number;
  length?: number;
  width?: number;
  surface?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    name: string;
    status: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  _count: {
    bookings: number;
    timeSlots: number;
    maintenance: number;
  };
}

interface AdminCourtsResponse {
  courts: AdminCourt[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const fetcher = async (url: string): Promise<AdminCourtsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch admin courts');
  }
  return response.json();
};

export function useAdminCourts(params: UseAdminCourtsParams = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.search) {
    searchParams.append('search', params.search);
  }
  if (params.sportType) {
    searchParams.append('sportType', params.sportType);
  }
  if (params.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString());
  }
  if (params.facilityId) {
    searchParams.append('facilityId', params.facilityId);
  }
  if (params.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const url = `/api/admin/courts?${searchParams.toString()}`;

  return useSWR<AdminCourtsResponse>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
}
