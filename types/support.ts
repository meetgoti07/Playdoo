export interface SupportTicket {
  id: string;
  hashId: number;
  userId?: string;
  email: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
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
}

export interface SupportTicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateSupportTicketData {
  subject: string;
  message: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface UpdateSupportTicketData {
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  message?: string;
}

export interface SupportTicketResponse {
  ticket: SupportTicket;
  message: string;
}

export interface SupportTicketsListResponse {
  tickets: SupportTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
