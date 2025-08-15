import useSWR from "swr";

interface ReportStats {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  resolvedReports: number;
  dismissedReports: number;
  userReports: number;
  facilityReports: number;
  avgResolutionTime: number;
  reportGrowth: number;
  pendingGrowth: number;
  reviewGrowth: number;
  resolvedGrowth: number;
  dismissedGrowth: number;
  userReportGrowth: number;
  facilityReportGrowth: number;
  resolutionTimeChange: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useReportStats() {
  const { data, error, isLoading, mutate } = useSWR<ReportStats>(
    "/api/admin/reports/stats",
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
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
