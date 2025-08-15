import useSWR from "swr";

interface FacilityFilters {
  status?: string;
  city?: string;
  search?: string;
}

interface Facility {
  id: string;
  name: string;
  description?: string;
  city: string;
  state: string;
  venueType: string;
  status: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
  photos: Array<{
    url: string;
  }>;
  _count: {
    courts: number;
  };
}

interface FacilitiesResponse {
  facilities: Facility[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useFacilities(filters: FacilityFilters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.city) queryParams.append("city", filters.city);
  if (filters.search) queryParams.append("search", filters.search);

  const { data, error, isLoading, mutate } = useSWR<FacilitiesResponse>(
    `/api/admin/facilities?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.facilities,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function usePendingFacilities() {
  const { data, error, isLoading } = useSWR<{ count: number }>(
    "/api/admin/facilities/pending/count",
    fetcher,
    {
      refreshInterval: 30000,
    }
  );

  return {
    data: data?.count,
    error,
    isLoading,
  };
}
