"use client";

import { useUserAnalytics } from "@/hooks/swr/admin/useUserAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Target,
  Clock,
  Award,
  MapPin,
  Activity
} from "lucide-react";

interface UserAnalyticsStatsProps {
  userId: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function UserAnalyticsStats({ userId, dateRange }: UserAnalyticsStatsProps) {
  const { stats, isLoading, error } = useUserAnalytics(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load user statistics
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: "All time bookings",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Bookings",
      value: stats.completedBookings,
      description: `${((stats.completedBookings / stats.totalBookings) * 100).toFixed(1)}% completion rate`,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Spent",
      value: `₹${stats.totalSpent?.toLocaleString() || 0}`,
      description: "Lifetime spending",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Average Booking",
      value: `₹${stats.averageBookingValue?.toLocaleString() || 0}`,
      description: "Per booking value",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Booking Frequency",
      value: `${stats.bookingFrequency?.toFixed(1) || 0}/month`,
      description: "Monthly average",
      icon: Clock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Favorite Sport",
      value: stats.favoriteSport || "N/A",
      description: "Most booked sport",
      icon: Award,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Favorite Facility",
      value: stats.favoriteFacility || "N/A",
      description: "Most visited facility",
      icon: MapPin,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Cancelled Bookings",
      value: stats.cancelledBookings,
      description: `${((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1)}% cancellation rate`,
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
