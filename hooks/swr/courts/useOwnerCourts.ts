import useSWR from 'swr';

interface UseOwnerCourtsParams {
  facilityId?: string;
  sportType?: string;
  isActive?: boolean;
}

interface Court {
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
  };
  _count: {
    bookings: number;
    timeSlots: number;
  };
}

interface OwnerCourtsResponse {
  courts: Court[];
}

const fetcher = async (url: string): Promise<OwnerCourtsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch courts');
  }
  return response.json();
};

export function useOwnerCourts(params: UseOwnerCourtsParams = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.facilityId) {
    searchParams.append('facilityId', params.facilityId);
  }
  if (params.sportType) {
    searchParams.append('sportType', params.sportType);
  }
  if (params.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString());
  }

  const url = `/api/owner/courts?${searchParams.toString()}`;

  return useSWR<OwnerCourtsResponse>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
}
