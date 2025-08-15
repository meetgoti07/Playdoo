"use client";

import { useUserAnalytics } from "@/hooks/swr/admin/useUserAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface UserAnalyticsChartsProps {
  userId: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function UserAnalyticsCharts({ userId, dateRange }: UserAnalyticsChartsProps) {
  const { 
    bookingTrend, 
    sportPreference, 
    timePreference, 
    facilityUsage,
    isLoading, 
    error 
  } = useUserAnalytics(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load user analytics charts
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00'];

  return (
    <div className="space-y-6">
      {/* Booking Trend - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={bookingTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'amount' ? `₹${value?.toLocaleString()}` : value,
                  name === 'amount' ? 'Amount Spent' : 'Bookings'
                ]}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="bookings" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.6}
                name="Bookings"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="amount" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d' }}
                name="Amount"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sport Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Sport Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sportPreference || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sport, percentage }) => `${sport} ${percentage?.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {(sportPreference || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferred Booking Times</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timePreference || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour"
                  tickFormatter={(hour: number) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour: number) => `${hour}:00 - ${hour + 1}:00`}
                  formatter={(value: any) => [value, 'Bookings']}
                />
                <Bar dataKey="bookings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Facility Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facilityUsage || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="facilityName" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
