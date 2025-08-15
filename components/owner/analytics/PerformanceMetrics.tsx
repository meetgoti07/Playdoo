"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Calendar, Users, Star } from "lucide-react";

interface PerformanceMetric {
  title: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  description: string;
}

interface FacilityPerformance {
  name: string;
  occupancyRate: number;
  revenue: number;
  bookings: number;
  rating: number;
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [facilities, setFacilities] = useState<FacilityPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      // Simulate API data - replace with actual endpoints
      setMetrics([
        {
          title: "Average Occupancy Rate",
          value: 68,
          target: 75,
          unit: "%",
          trend: 5.2,
          description: "Court utilization across all facilities"
        },
        {
          title: "Customer Satisfaction",
          value: 4.6,
          target: 4.5,
          unit: "/5",
          trend: 0.3,
          description: "Average rating from customer reviews"
        },
        {
          title: "Booking Conversion",
          value: 82,
          target: 85,
          unit: "%",
          trend: -2.1,
          description: "Inquiries that convert to bookings"
        },
        {
          title: "Revenue Growth",
          value: 15.8,
          target: 20,
          unit: "%",
          trend: 3.5,
          description: "Month-over-month revenue increase"
        }
      ]);

      setFacilities([
        {
          name: "Sports Complex A",
          occupancyRate: 75,
          revenue: 45000,
          bookings: 123,
          rating: 4.7
        },
        {
          name: "Tennis Arena B",
          occupancyRate: 68,
          revenue: 32000,
          bookings: 89,
          rating: 4.5
        },
        {
          name: "Multi-Sport Center C",
          occupancyRate: 82,
          revenue: 56000,
          bookings: 156,
          rating: 4.8
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    </div>
  );
}
