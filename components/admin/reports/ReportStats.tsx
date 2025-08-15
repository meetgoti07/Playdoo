"use client";

import { useReportStats } from "@/hooks/swr/admin/useReportStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Building
} from "lucide-react";

export function ReportStats() {
  const { data: stats, isLoading, error } = useReportStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-600">Failed to load report statistics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Reports",
      value: stats?.totalReports || 0,
      change: stats?.reportGrowth || 0,
      icon: Shield,
      color: "text-blue-600",
    },
    {
      title: "Pending Reports", 
      value: stats?.pendingReports || 0,
      change: stats?.pendingGrowth || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      title: "Under Review",
      value: stats?.underReviewReports || 0,
      change: stats?.reviewGrowth || 0,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Resolved Reports",
      value: stats?.resolvedReports || 0,
      change: stats?.resolvedGrowth || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Dismissed Reports",
      value: stats?.dismissedReports || 0,
      change: stats?.dismissedGrowth || 0,
      icon: XCircle,
      color: "text-gray-600",
    },
    {
      title: "User Reports",
      value: stats?.userReports || 0,
      change: stats?.userReportGrowth || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Facility Reports",
      value: stats?.facilityReports || 0,
      change: stats?.facilityReportGrowth || 0,
      icon: Building,
      color: "text-indigo-600",
    },
    {
      title: "Avg Resolution Time",
      value: `${stats?.avgResolutionTime || 0}h`,
      change: stats?.resolutionTimeChange || 0,
      icon: TrendingUp,
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change !== undefined && (
              <p className="text-xs text-gray-600">
                <span
                  className={
                    stat.change >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {stat.change >= 0 ? "+" : ""}{stat.change}%
                </span>{" "}
                from last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
