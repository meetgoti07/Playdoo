import useSWR from "swr";

interface UseReportsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}

interface Report {
  id: string;
  hashId: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  reportedBy: {
    name: string;
    email: string;
    image?: string;
  };
  reportedUser?: {
    name: string;
  };
  reportedFacility?: {
    name: string;
  };
}

interface ReportsResponse {
  reports: Report[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useReports(params: UseReportsParams = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);

  const { data, error, isLoading, mutate } = useSWR<ReportsResponse>(
    `/api/admin/reports?${searchParams.toString()}`,
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
