"use client";

import { Button } from "@/components/ui/button";
import { Download, Calendar, RefreshCw, BarChart3, Clock } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BookingsHeader() {
  const { mutate: refreshBookings } = useSWR("/api/owner/bookings", fetcher);
  const { mutate: refreshStats } = useSWR("/api/owner/bookings/stats", fetcher);

  const handleRefresh = () => {
    refreshBookings();
    refreshStats();
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/owner/bookings/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all your facility bookings and track performance
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('/owner/schedule', '_blank')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule View
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('/owner/analytics', '_blank')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}

    </div>
  );
}
