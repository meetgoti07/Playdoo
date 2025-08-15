"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Calendar, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useAdminStats } from "@/hooks/swr/admin/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboardStats() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load statistics
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Facilities",
      value: stats?.totalFacilities || 0,
      change: stats?.facilityGrowth || 0,
      icon: Building2,
      color: "text-green-600",
    },
    {
      title: "Active Bookings",
      value: stats?.activeBookings || 0,
      change: stats?.bookingGrowth || 0,
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      title: "Active Courts",
      value: stats?.activeCourts || 0,
      change: stats?.courtGrowth || 0,
      icon: Trophy,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={isPositive ? "text-green-500" : "text-red-500"}>
                  {Math.abs(stat.change)}%
                </span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
