import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface SupportTicket {
  id: string;
  hashId: number;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface SupportTicketReply {
  id: string;
  hashId: number;
  supportTicketId: string;
  authorType: "USER" | "ADMIN";
  message: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface SupportTicketFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export function useSupportTickets(filters: SupportTicketFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const { data, error, isLoading, mutate } = useSWR<{
    tickets: SupportTicket[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(`/api/support?${params.toString()}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    tickets: data?.tickets || [],
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function useSupportTicket(ticketId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ ticket: SupportTicket }>(
    ticketId ? `/api/support/${ticketId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    ticket: data?.ticket,
    error,
    isLoading,
    mutate,
  };
}

export function useSupportTicketReplies(ticketId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ replies: SupportTicketReply[] }>(
    ticketId ? `/api/support/${ticketId}/replies` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    replies: data?.replies || [],
    error,
    isLoading,
    mutate,
  };
}

// Support ticket actions
export async function createSupportTicket(data: {
  subject: string;
  message: string;
  priority?: string;
}) {
  const response = await fetch("/api/support", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create support ticket");
  }

  return response.json();
}

export async function updateSupportTicket(ticketId: string, data: any) {
  const response = await fetch(`/api/support/${ticketId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update support ticket");
  }

  return response.json();
}
