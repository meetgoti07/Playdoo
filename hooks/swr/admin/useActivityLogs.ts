import useSWR from "swr";

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export interface ActivityLogFilters {
  search?: string;
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ActivityLogResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    adminActions: number;
    userActions: number;
    systemEvents: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useActivityLogs(filters?: ActivityLogFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.action) queryParams.append("action", filters.action);
  if (filters?.entityType) queryParams.append("entityType", filters.entityType);
  if (filters?.page) queryParams.append("page", filters.page.toString());
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.startDate) queryParams.append("startDate", filters.startDate.toISOString());
  if (filters?.endDate) queryParams.append("endDate", filters.endDate.toISOString());

  const { data, error, isLoading, mutate } = useSWR<ActivityLogResponse>(
    `/api/admin/activity-logs?${queryParams.toString()}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
