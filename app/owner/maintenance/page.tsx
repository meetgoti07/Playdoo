"use client";

import { Suspense } from "react";
import { MaintenanceHeader } from "@/components/owner/maintenance/MaintenanceHeader";
import { MaintenanceList } from "@/components/owner/maintenance/MaintenanceList";
import { MaintenanceCalendar } from "@/components/owner/maintenance/MaintenanceCalendar";
import { MaintenanceStats } from "@/components/owner/maintenance/MaintenanceStats";
import { Skeleton } from "@/components/ui/skeleton";
import { mutate } from "swr";

export default function MaintenancePage() {
  const handleMaintenanceCreated = () => {
    // Revalidate SWR cache for maintenance data
    mutate("/api/owner/maintenance");
  };

  return (
    <div className="space-y-6">
      <MaintenanceHeader onMaintenanceCreated={handleMaintenanceCreated} />
      
      <Suspense fallback={<Skeleton className="h-32" />}>
        <MaintenanceStats />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <MaintenanceList />
          </Suspense>
        </div>
        
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <MaintenanceCalendar />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
