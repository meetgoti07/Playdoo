import useSWR from "swr";

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  userId?: string;
  entityId?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRecentActivity() {
  const { data, error, isLoading, mutate } = useSWR<RecentActivity[]>(
    "/api/admin/recent-activity",
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
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
