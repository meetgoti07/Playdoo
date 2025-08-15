import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface UserReport {
  id: string;
  hashId: number;
  type: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reportedFacility?: {
    name: string;
    id: string;
  };
  reportedUser?: {
    name: string;
    id: string;
  };
}

interface UseUserReportsParams {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export function useUserReports(params?: UseUserReportsParams) {
  const searchParams = new URLSearchParams();
  
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/profile/reports?${searchParams.toString()}`,
    fetcher
  );

  return {
    reports: data?.reports || [],
    totalCount: data?.totalCount || 0,
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate,
  };
}
