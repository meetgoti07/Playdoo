"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from "recharts";

export default function AdminCourtAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data - replace with real API calls
  const courtsByType = [
    { name: "Badminton", count: 45, percentage: 35 },
    { name: "Tennis", count: 25, percentage: 20 },
    { name: "Football", count: 20, percentage: 15 },
    { name: "Basketball", count: 15, percentage: 12 },
    { name: "Cricket", count: 10, percentage: 8 },
    { name: "Other", count: 13, percentage: 10 },
  ];

  const courtStatus = [
    { name: "Active", value: 95, color: "#10B981" },
    { name: "Inactive", value: 23, color: "#F59E0B" },
    { name: "Under Maintenance", value: 10, color: "#EF4444" },
  ];

  const bookingTrends = [
    { month: "Jan", bookings: 120, revenue: 48000 },
    { month: "Feb", bookings: 135, revenue: 54000 },
    { month: "Mar", bookings: 158, revenue: 63200 },
    { month: "Apr", bookings: 142, revenue: 56800 },
    { month: "May", bookings: 168, revenue: 67200 },
    { month: "Jun", bookings: 185, revenue: 74000 },
  ];

  const topPerformingCourts = [
    { 
      name: "Elite Sports Complex - Court 1", 
      facility: "Elite Sports Complex",
      sport: "Badminton",
      bookings: 45, 
      revenue: 22500,
      utilizationRate: 85 
    },
    { 
      name: "Sports Arena - Tennis Court A", 
      facility: "Sports Arena",
      sport: "Tennis",
      bookings: 38, 
      revenue: 19000,
      utilizationRate: 82 
    },
    { 
      name: "City Sports - Football Ground", 
      facility: "City Sports",
      sport: "Football",
      bookings: 32, 
      revenue: 16000,
      utilizationRate: 78 
    },
    { 
      name: "Premier Club - Basketball Court", 
      facility: "Premier Club",
      sport: "Basketball",
      bookings: 29, 
      revenue: 14500,
      utilizationRate: 75 
    },
    { 
      name: "Metro Sports - Squash Court 2", 
      facility: "Metro Sports",
      sport: "Squash",
      bookings: 26, 
      revenue: 13000,
      utilizationRate: 72 
    },
  ];

  const utilizationData = [
    { hour: "6 AM", utilization: 45 },
    { hour: "7 AM", utilization: 65 },
    { hour: "8 AM", utilization: 85 },
    { hour: "9 AM", utilization: 92 },
    { hour: "10 AM", utilization: 78 },
    { hour: "11 AM", utilization: 68 },
    { hour: "12 PM", utilization: 72 },
    { hour: "1 PM", utilization: 58 },
    { hour: "2 PM", utilization: 62 },
    { hour: "3 PM", utilization: 75 },
    { hour: "4 PM", utilization: 88 },
    { hour: "5 PM", utilization: 95 },
    { hour: "6 PM", utilization: 98 },
    { hour: "7 PM", utilization: 92 },
    { hour: "8 PM", utilization: 85 },
    { hour: "9 PM", utilization: 75 },
    { hour: "10 PM", utilization: 42 },
  ];

  const stats = {
    totalCourts: 128,
    activeCourts: 95,
    totalBookings: 1248,
    totalRevenue: 624000,
    averageUtilization: 78,
    topSport: "Badminton",
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics for all courts across facilities</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourts}</div>
            <p className="text-xs text-muted-foreground">Across all facilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCourts}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageUtilization}%</div>
            <p className="text-xs text-muted-foreground">Across all courts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topSport}</div>
            <p className="text-xs text-muted-foreground">Most popular</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courts by Sport Type */}
        <Card>
          <CardHeader>
            <CardTitle>Courts by Sport Type</CardTitle>
            <CardDescription>Distribution of courts across different sports</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courtsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Court Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Court Status Distribution</CardTitle>
            <CardDescription>Current status of all courts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courtStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courtStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Booking & Revenue Trends</CardTitle>
            <CardDescription>Monthly bookings and revenue overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="bookings" fill="#10B981" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Utilization</CardTitle>
            <CardDescription>Court utilization throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Courts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Courts</CardTitle>
          <CardDescription>Courts with highest bookings and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformingCourts.map((court, index) => (
              <div key={court.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{court.name}</div>
                    <div className="text-sm text-gray-500">{court.facility}</div>
                  </div>
                  <Badge variant="outline">{court.sport}</Badge>
                </div>
                <div className="flex items-center space-x-8 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{court.bookings}</div>
                    <div className="text-gray-500">Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">₹{court.revenue.toLocaleString()}</div>
                    <div className="text-gray-500">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{court.utilizationRate}%</div>
                    <div className="text-gray-500">Utilization</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
