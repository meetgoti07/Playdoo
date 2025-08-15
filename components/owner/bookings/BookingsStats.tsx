"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, XCircle, TrendingUp, IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  growthPercentage: number;
  revenueGrowthPercentage: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BookingsStats() {
  const { data, error, isLoading } = useSWR("/api/owner/bookings/stats", fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  const stats: BookingStats = data?.stats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading booking statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      growth: stats.growthPercentage,
    },
    {
      title: "Pending Approval",
      value: stats.pendingBookings,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Confirmed",
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Completed",
      value: stats.completedBookings,
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      growth: stats.revenueGrowthPercentage,
    },
  ];

  const formatGrowth = (growth: number) => {
    if (growth === 0) return null;
    const isPositive = growth > 0;
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className={`h-3 w-3 mr-1 ${isPositive ? '' : 'rotate-180'}`} />
        {Math.abs(growth).toFixed(1)}% vs last month
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.growth !== undefined && formatGrowth(card.growth)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              ₹{stats.todayRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              ₹{stats.weekRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{stats.weekBookings} bookings</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              ₹{stats.monthRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{stats.monthBookings} bookings</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
