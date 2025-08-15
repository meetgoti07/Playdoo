import useSWR from 'swr';
import { format, startOfWeek } from 'date-fns';

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  blockReason?: string;
  isBooked: boolean;
  price: number;
  booking?: {
    id: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    totalAmount: number;
  };
}

export interface Court {
  id: string;
  name: string;
  sportType: string;
  pricePerHour: number;
  timeSlots: TimeSlot[];
}

export interface Facility {
  id: string;
  name: string;
  courts: Court[];
}

export interface ScheduleResponse {
  schedule: Facility[];
  weekStart: string;
  weekEnd: string;
  success: boolean;
}

const fetcher = async (url: string): Promise<ScheduleResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch schedule');
  }
  return response.json();
};

export function useOwnerSchedule(facilityId?: string, selectedDate: Date = new Date()) {
  const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const params = new URLSearchParams({ weekStart });
  
  if (facilityId) {
    params.append('facilityId', facilityId);
  }

  return useSWR<ScheduleResponse>(
    `/api/owner/schedule?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );
}

export async function blockTimeSlot(data: {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  blockReason?: string;
}) {
  const response = await fetch('/api/owner/schedule/block', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to block time slot');
  }

  return response.json();
}

export async function unblockTimeSlot(timeSlotId: string) {
  const response = await fetch(`/api/owner/schedule/block?timeSlotId=${timeSlotId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unblock time slot');
  }

  return response.json();
}
