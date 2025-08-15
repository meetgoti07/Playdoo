import { Suspense } from "react";
import { RevenueHeader } from "@/components/owner/revenue/RevenueHeader";
import { RevenueOverview } from "@/components/owner/revenue/RevenueOverview";
import { RevenueChart } from "@/components/owner/revenue/RevenueChart";
import { FacilityRevenueBreakdown } from "@/components/owner/revenue/FacilityRevenueBreakdown";
import { RecentTransactions } from "@/components/owner/revenue/RecentTransactions";
import { Skeleton } from "@/components/ui/skeleton";

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <RevenueHeader />
      
      <Suspense fallback={<Skeleton className="h-32" />}>
        <RevenueOverview />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <RevenueChart />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-96" />}>
          <FacilityRevenueBreakdown />
        </Suspense>
      </div>
      
      <Suspense fallback={<Skeleton className="h-64" />}>
        <RecentTransactions />
      </Suspense>
    </div>
  );
}
