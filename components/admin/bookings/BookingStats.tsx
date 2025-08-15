"use client";

import { useBookingStats } from "@/hooks/swr/admin/useBookingStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Users
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function BookingStats() {
  const { data: stats, isLoading } = useBookingStats();

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

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      change: stats?.bookingGrowth || 0,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Confirmed Bookings", 
      value: stats?.confirmedBookings || 0,
      change: stats?.confirmedGrowth || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Bookings",
      value: stats?.pendingBookings || 0,
      change: stats?.pendingGrowth || 0,
      icon: AlertCircle,
      color: "text-yellow-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: stats?.revenueGrowth || 0,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      change: stats?.activeUserGrowth || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Avg Session Duration",
      value: `${stats?.avgSessionDuration || 0}h`,
      change: stats?.sessionGrowth || 0,
      icon: Clock,
      color: "text-indigo-600",
    },
    {
      title: "Cancelled Bookings",
      value: stats?.cancelledBookings || 0,
      change: stats?.cancellationRate || 0,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      change: stats?.completionGrowth || 0,
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
