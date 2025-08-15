import useSWR from "swr";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  dataType: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  parsedValue?: any;
}

interface SystemSettingsResponse {
  settings: Record<string, SystemSetting[]>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSystemSettings(category?: string) {
  const queryParams = new URLSearchParams();
  if (category) queryParams.append("category", category);

  const { data, error, isLoading, mutate } = useSWR<SystemSettingsResponse>(
    `/api/admin/settings?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    data: data?.settings,
    error,
    isLoading,
    mutate,
  };
}

// Settings actions
export async function updateSetting(settingData: {
  key: string;
  value: any;
  dataType: string;
  category: string;
  isPublic?: boolean;
}) {
  const response = await fetch("/api/admin/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settingData),
  });

  if (!response.ok) {
    throw new Error("Failed to update setting");
  }

  return response.json();
}

export async function bulkUpdateSettings(settings: Array<{
  key: string;
  value: any;
  dataType: string;
}>) {
  const response = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    throw new Error("Failed to bulk update settings");
  }

  return response.json();
}

// Default system settings that should exist
export const DEFAULT_SETTINGS = {
  general: [
    { key: "site_name", value: "QuickCourt", dataType: "string", description: "Site Name" },
    { key: "site_description", value: "Sports Facility Booking Platform", dataType: "string", description: "Site Description" },
    { key: "support_email", value: "support@quickcourt.com", dataType: "string", description: "Support Email" },
    { key: "maintenance_mode", value: false, dataType: "boolean", description: "Maintenance Mode" },
  ],
  booking: [
    { key: "booking_advance_days", value: 30, dataType: "number", description: "Maximum advance booking days" },
    { key: "cancellation_hours", value: 24, dataType: "number", description: "Minimum hours before cancellation" },
    { key: "booking_confirmation_auto", value: true, dataType: "boolean", description: "Auto-confirm bookings" },
  ],
  payments: [
    { key: "platform_commission", value: 5, dataType: "number", description: "Platform commission %" },
    { key: "payment_gateway", value: "razorpay", dataType: "string", description: "Payment Gateway" },
    { key: "refund_processing_days", value: 7, dataType: "number", description: "Refund processing days" },
  ],
  notifications: [
    { key: "email_notifications", value: true, dataType: "boolean", description: "Enable email notifications" },
    { key: "sms_notifications", value: false, dataType: "boolean", description: "Enable SMS notifications" },
    { key: "push_notifications", value: true, dataType: "boolean", description: "Enable push notifications" },
  ],
  security: [
    { key: "login_attempts", value: 5, dataType: "number", description: "Max login attempts" },
    { key: "session_timeout", value: 30, dataType: "number", description: "Session timeout (minutes)" },
    { key: "password_min_length", value: 8, dataType: "number", description: "Minimum password length" },
  ],
};
