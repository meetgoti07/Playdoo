"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target } from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  totalBookings: number;
  bookingGrowth: number;
  occupancyRate: number;
  averageBookingValue: number;
}

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch("/api/owner/analytics/overview");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return null; // Could add skeleton here
  }

  const metrics = [
    {
      title: "Total Revenue",
      value: `₹${data.totalRevenue.toLocaleString()}`,
      change: data.revenueGrowth,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Bookings",
      value: data.totalBookings.toLocaleString(),
      change: data.bookingGrowth,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Occupancy Rate",
      value: `${data.occupancyRate.toFixed(1)}%`,
      change: 0, // Calculate based on previous period
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg. Booking Value",
      value: `₹${data.averageBookingValue.toLocaleString()}`,
      change: 0, // Calculate based on previous period
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.change !== 0 && (
              <div className="flex items-center text-xs mt-1">
                {metric.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={metric.change > 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(metric.change).toFixed(1)}% from last period
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
