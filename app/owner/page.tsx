import { Suspense } from "react";
import { DashboardOverview } from "@/components/owner/dashboard/DashboardOverview";
import { RecentBookings } from "@/components/owner/dashboard/RecentBookings";
import { RevenueChart } from "@/components/owner/dashboard/RevenueChart";
import { QuickActions } from "@/components/owner/dashboard/QuickActions";
import { FacilityStatusCard } from "@/components/owner/dashboard/FacilityStatusCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function OwnerDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Overview Cards */}
      <Suspense fallback={<Skeleton className="h-24 sm:h-32" />}>
        <DashboardOverview />
      </Suspense>

      {/* Facility Status */}
      <Suspense fallback={<Skeleton className="h-36 sm:h-48" />}>
        <FacilityStatusCard />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <div>
          <Suspense fallback={<Skeleton className="h-64 sm:h-80 lg:h-96" />}>
            <RevenueChart />
          </Suspense>
        </div>
      </div>

      {/* Recent Bookings */}
      <Suspense fallback={<Skeleton className="h-48 sm:h-64" />}>
        <RecentBookings />
      </Suspense>
    </div>
  );
}
