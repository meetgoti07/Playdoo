import useSWR from "swr";

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface ActivityLogsResponse {
  activities: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ActivityLogFilters {
  entity?: string;
  action?: string;
  userId?: string;
  search?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useActivityLogs(filters: ActivityLogFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters.entity && filters.entity !== "all") queryParams.append("entity", filters.entity);
  if (filters.entityType && filters.entityType !== "all") queryParams.append("entityType", filters.entityType);
  if (filters.action && filters.action !== "all") queryParams.append("action", filters.action);
  if (filters.userId) queryParams.append("userId", filters.userId);
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.limit) queryParams.append("limit", filters.limit.toString());

  const { data, error, isLoading, mutate } = useSWR<ActivityLogsResponse>(
    `/api/admin/activity-logs?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.activities,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function useUserActivityLogs(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<ActivityLogsResponse>(
    userId ? `/api/admin/activity-logs?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.activities,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

// Helper functions to format activity data
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    'CREATE_USER': 'Created User',
    'UPDATE_USER': 'Updated User',
    'DELETE_USER': 'Deleted User',
    'BAN_USER': 'Banned User',
    'UNBAN_USER': 'Unbanned User',
    'CREATE_FACILITY': 'Created Facility',
    'UPDATE_FACILITY': 'Updated Facility',
    'DELETE_FACILITY': 'Deleted Facility',
    'APPROVE_FACILITY': 'Approved Facility',
    'REJECT_FACILITY': 'Rejected Facility',
    'SUSPEND_FACILITY': 'Suspended Facility',
    'CREATE_BOOKING': 'Created Booking',
    'UPDATE_BOOKING': 'Updated Booking',
    'CANCEL_BOOKING': 'Cancelled Booking',
    'CREATE_REPORT': 'Created Report',
    'RESOLVE_REPORT': 'Resolved Report',
    'DISMISS_REPORT': 'Dismissed Report',
    'ESCALATE_REPORT': 'Escalated Report',
    'CREATE_COUPON': 'Created Coupon',
    'UPDATE_COUPON': 'Updated Coupon',
    'DELETE_COUPON': 'Deleted Coupon',
    'CREATE_SUPPORT_TICKET': 'Created Support Ticket',
    'UPDATE_SUPPORT_TICKET': 'Updated Support Ticket',
    'UPDATE_SYSTEM_SETTING': 'Updated System Setting',
    'BULK_UPDATE_SYSTEM_SETTINGS': 'Bulk Updated Settings',
  };

  return actionMap[action] || action.replace(/_/g, ' ');
}

export function getActivityIcon(entity: string): string {
  const iconMap: Record<string, string> = {
    'user': '👤',
    'facility': '🏢',
    'booking': '📅',
    'payment': '💳',
    'report': '🚨',
    'coupon': '🎫',
    'support_ticket': '🎧',
    'system_setting': '⚙️',
  };

  return iconMap[entity] || '📝';
}

export function getActivityColor(action: string): string {
  if (action.includes('CREATE')) return 'green';
  if (action.includes('DELETE') || action.includes('BAN')) return 'red';
  if (action.includes('UPDATE') || action.includes('APPROVE')) return 'blue';
  if (action.includes('REJECT') || action.includes('SUSPEND')) return 'orange';
  return 'gray';
}
