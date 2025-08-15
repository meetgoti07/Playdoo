import { Suspense } from "react";
import { AnalyticsHeader } from "@/components/owner/analytics/AnalyticsHeader";
import { AnalyticsOverview } from "@/components/owner/analytics/AnalyticsOverview";
import { RevenueAnalytics } from "@/components/owner/analytics/RevenueAnalytics";
import { BookingAnalytics } from "@/components/owner/analytics/BookingAnalytics";
import { PerformanceMetrics } from "@/components/owner/analytics/PerformanceMetrics";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <AnalyticsHeader />
      
      <Suspense fallback={<Skeleton className="h-32" />}>
        <AnalyticsOverview />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <RevenueAnalytics />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-96" />}>
          <BookingAnalytics />
        </Suspense>
      </div>
      
      <Suspense fallback={<Skeleton className="h-64" />}>
        <PerformanceMetrics />
      </Suspense>
    </div>
  );
}
