import useSWR from "swr";

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedAmount: number;
  successRate: number;
  platformFee: number;
  revenueGrowth: number;
  paymentGrowth: number;
  successGrowth: number;
  failureGrowth: number;
  pendingGrowth: number;
  refundGrowth: number;
  successRateChange: number;
  platformFeeGrowth: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePaymentStats() {
  const { data, error, isLoading, mutate } = useSWR<PaymentStats>(
    "/api/admin/payments/stats",
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
