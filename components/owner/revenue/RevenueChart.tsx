"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RevenueChart() {
  const { data, error, isLoading } = useSWR("/api/owner/revenue", fetcher);

  if (isLoading) {
    return <RevenueChartSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load revenue chart</p>
        </CardContent>
      </Card>
    );
  }

  const { monthlyRevenue = [] } = data || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly revenue for the last 12 months
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
              labelStyle={{ color: "#000" }}
            />
            <Bar 
              dataKey="revenue" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RevenueChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
