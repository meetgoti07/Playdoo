"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FacilityRevenueBreakdown() {
  const { data, error, isLoading } = useSWR("/api/owner/revenue", fetcher);

  if (isLoading) {
    return <FacilityRevenueBreakdownSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facility Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load facility revenue data</p>
        </CardContent>
      </Card>
    );
  }

  const { facilityRevenue = [], totalRevenue = 0 } = data || {};

  // Sort facilities by revenue
  const sortedFacilities = facilityRevenue.sort((a: any, b: any) => b.revenue - a.revenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Facility Revenue Breakdown
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Revenue contribution by each facility
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedFacilities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No revenue data available
          </p>
        ) : (
          sortedFacilities.map((facility: any) => {
            const percentage = totalRevenue > 0 ? (facility.revenue / totalRevenue) * 100 : 0;
            
            return (
              <div key={facility.facilityId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{facility.facilityName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {facility.transactions} transactions
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{facility.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })
        )}
        
        {sortedFacilities.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between font-semibold">
              <span>Total Revenue</span>
              <span>₹{totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FacilityRevenueBreakdownSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-56 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-2 w-full bg-muted animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
