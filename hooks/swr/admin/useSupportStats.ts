import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
  satisfactionRate: number;
  pendingTickets: number;
  highPriorityTickets: number;
  todaysTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  statusBreakdown: {
    OPEN: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    CLOSED: number;
  };
  priorityBreakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

export function useSupportStats() {
  const { data, error, isLoading, mutate } = useSWR<{ stats: SupportStats }>(
    "/api/admin/support/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    data: data?.stats,
    error,
    isLoading,
    mutate,
  };
}
