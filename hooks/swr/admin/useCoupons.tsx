import useSWR from "swr";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  currentUsage: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableSports: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookingCoupons: number;
  };
}

interface CouponsResponse {
  coupons: Coupon[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CouponFilters {
  isActive: string;
  search: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCoupons(filters: CouponFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters.isActive && filters.isActive !== "all") queryParams.append("isActive", filters.isActive);
  if (filters.search) queryParams.append("search", filters.search);

  const { data, error, isLoading, mutate } = useSWR<CouponsResponse>(
    `/api/admin/coupons?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.coupons,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function useCouponDetails(couponId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ coupon: Coupon }>(
    couponId ? `/api/admin/coupons/${couponId}/details` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.coupon,
    error,
    isLoading,
    mutate,
  };
}

export function useCouponUsage(couponId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ usage: any[] }>(
    couponId ? `/api/admin/coupons/${couponId}/usage` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.usage,
    error,
    isLoading,
    mutate,
  };
}

// Coupon actions
export async function createCoupon(couponData: {
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  validFrom: string;
  validUntil: string;
  applicableSports?: string[];
}) {
  const response = await fetch("/api/admin/coupons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create coupon");
  }

  return response.json();
}

export async function updateCoupon(couponId: string, couponData: Partial<Coupon>) {
  const response = await fetch(`/api/admin/coupons/${couponId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    throw new Error("Failed to update coupon");
  }

  return response.json();
}

export async function toggleCouponStatus(couponId: string, isActive: boolean) {
  const response = await fetch(`/api/admin/coupons/${couponId}/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    throw new Error("Failed to toggle coupon status");
  }

  return response.json();
}

export async function deleteCoupon(couponId: string) {
  const response = await fetch(`/api/admin/coupons/${couponId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete coupon");
  }

  return response.json();
}
