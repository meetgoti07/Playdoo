"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RevenueOverview() {
  const { data, error, isLoading } = useSWR("/api/owner/revenue", fetcher);

  if (isLoading) {
    return <RevenueOverviewSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load revenue data</p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalRevenue = 0,
    revenueGrowth = 0,
    recentTransactions = [],
  } = data || {};

  const isPositiveGrowth = revenueGrowth >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {isPositiveGrowth ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
            )}
            <span className={isPositiveGrowth ? "text-green-600" : "text-red-600"}>
              {Math.abs(revenueGrowth).toFixed(1)}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentTransactions.length}</div>
          <p className="text-xs text-muted-foreground">Recent transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{recentTransactions.length > 0 
              ? (totalRevenue / recentTransactions.length).toLocaleString() 
              : 0}
          </div>
          <p className="text-xs text-muted-foreground">Per transaction</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          {isPositiveGrowth ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={isPositiveGrowth ? "text-green-600" : "text-red-600"}>
              {isPositiveGrowth ? "+" : ""}{revenueGrowth.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">From last period</p>
        </CardContent>
      </Card>
    </div>
  );
}

function RevenueOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
