import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface SupportTicket {
  id: string;
  hashId: number;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  email: string;
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  replies?: SupportTicketReply[];
  _count?: {
    replies: number;
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

export interface SupportFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useSupportTickets(filters: SupportFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.search) params.append("search", filters.search);
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
  }>(`/api/admin/support?${params.toString()}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    data: data?.tickets || [],
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function useSupportTicketDetails(ticketId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ ticket: SupportTicket; replies: SupportTicketReply[] }>(
    ticketId ? `/api/admin/support/${ticketId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.ticket,
    replies: data?.replies || [],
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

// Admin support ticket actions
export async function updateTicketStatus(ticketId: string, status: string, message?: string) {
  try {
    const response = await fetch(`/api/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Status update failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `/api/admin/support/${ticketId}`,
      });
      throw new Error(`Failed to update ticket status: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in updateTicketStatus:", error);
    throw error;
  }
}

export async function replyToTicket(ticketId: string, message: string) {
  const response = await fetch(`/api/admin/support/${ticketId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Failed to send reply");
  }

  return response.json();
}

export async function assignTicket(ticketId: string, assignedTo: string) {
  const response = await fetch(`/api/admin/support/${ticketId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ assignedTo }),
  });

  if (!response.ok) {
    throw new Error("Failed to assign ticket");
  }

  return response.json();
}
