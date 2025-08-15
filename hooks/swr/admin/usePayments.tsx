import useSWR from "swr";

interface UsePaymentsParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
  dateRange?: string;
}

interface Payment {
  id: string;
  hashId: string;
  amount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentGateway?: string;
  transactionId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: string;
  failureReason?: string;
  refundAmount?: number;
  refundedAt?: string;
  paidAt?: string;
  createdAt: string;
  booking: {
    user: {
      name: string;
      email: string;
      image?: string;
    };
    facility: {
      name: string;
    };
    court: {
      name: string;
    };
    bookingDate: string;
  };
}

interface PaymentsResponse {
  payments: Payment[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePayments(params: UsePaymentsParams = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.status) searchParams.set("status", params.status);
  if (params.method) searchParams.set("method", params.method);
  if (params.search) searchParams.set("search", params.search);
  if (params.dateRange) searchParams.set("dateRange", params.dateRange);

  const { data, error, isLoading, mutate } = useSWR<PaymentsResponse>(
    `/api/admin/payments?${searchParams.toString()}`,
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
