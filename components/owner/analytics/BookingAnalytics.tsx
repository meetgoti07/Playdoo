"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface BookingData {
  sportType: string;
  bookings: number;
  revenue: number;
}

interface HourlyData {
  hour: string;
  bookings: number;
}

export function BookingAnalytics() {
  const [sportData, setSportData] = useState<BookingData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingAnalytics();
  }, []);

  const fetchBookingAnalytics = async () => {
    try {
      // Simulate API calls - replace with actual endpoints
      setSportData([
        { sportType: "Badminton", bookings: 45, revenue: 22500 },
        { sportType: "Tennis", bookings: 32, revenue: 24000 },
        { sportType: "Football", bookings: 28, revenue: 21000 },
        { sportType: "Basketball", bookings: 18, revenue: 13500 },
      ]);

      setHourlyData([
        { hour: "06:00", bookings: 5 },
        { hour: "08:00", bookings: 12 },
        { hour: "10:00", bookings: 18 },
        { hour: "12:00", bookings: 8 },
        { hour: "14:00", bookings: 15 },
        { hour: "16:00", bookings: 22 },
        { hour: "18:00", bookings: 28 },
        { hour: "20:00", bookings: 15 },
      ]);
    } catch (error) {
      console.error("Failed to fetch booking analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sport Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Sport Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sportData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sportType, bookings }) => `${sportType}: ${bookings}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {sportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Bookings']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
