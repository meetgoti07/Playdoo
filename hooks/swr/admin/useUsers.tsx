import useSWR from "swr";

interface UserFilters {
  role: string;
  status: string;
  search: string;
}

interface User {
  id: string;
  hashId: number;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role?: string;
  status?: string;
  city?: string;
  state?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: string | null;
  lastLoginAt?: string | null;
  _count: {
    bookings: number;
    facilities?: number;
    reviews?: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers(filters: UserFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters.role) queryParams.append("role", filters.role);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.search) queryParams.append("search", filters.search);

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.users,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}
