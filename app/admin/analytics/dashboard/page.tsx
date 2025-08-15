"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Filter,
} from "lucide-react";
import { useAnalytics } from "@/hooks/swr/admin/useAnalytics";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [analyticsType, setAnalyticsType] = useState("overview");
  
  const { data: analytics, isLoading } = useAnalytics({
    dateRange,
    type: analyticsType,
  });

  const handleExport = () => {
    console.log("Exporting analytics...");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into platform performance
            </p>
          </div>
        </div>
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
      </div>
    );
  }

  const overviewStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(analytics?.totalRevenue || 0),
      change: analytics?.revenueGrowth || 0,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Users",
      value: analytics?.activeUsers || 0,
      change: analytics?.userGrowth || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Facilities",
      value: analytics?.activeFacilities || 0,
      change: analytics?.facilityGrowth || 0,
      icon: Building2,
      color: "text-purple-600",
    },
    {
      title: "Total Bookings",
      value: analytics?.totalBookings || 0,
      change: analytics?.bookingGrowth || 0,
      icon: Calendar,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into platform performance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Analytics Type</label>
              <Select value={analyticsType} onValueChange={setAnalyticsType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analytics type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="facilities">Facilities</SelectItem>
                  <SelectItem value="bookings">Bookings</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => (
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
                  from last period
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Revenue Chart</h3>
                <p>Revenue trends visualization would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">User Growth Chart</h3>
                <p>User growth visualization would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topSports?.map((sport: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{sport.name}</span>
                  <span className="text-sm text-gray-500">{sport.bookings} bookings</span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topCities?.map((city: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{city.name}</span>
                  <span className="text-sm text-gray-500">{city.facilities} facilities</span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Booking Value</span>
                <span className="text-sm text-gray-500">
                  {formatCurrency(analytics?.avgBookingValue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-gray-500">
                  {analytics?.completionRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cancellation Rate</span>
                <span className="text-sm text-gray-500">
                  {analytics?.cancellationRate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
