"use client";

import { usePaymentStats } from "@/hooks/swr/admin/usePaymentStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Percent
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PaymentStats() {
  const { data: stats, isLoading } = usePaymentStats();

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
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: stats?.revenueGrowth || 0,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Payments", 
      value: stats?.totalPayments || 0,
      change: stats?.paymentGrowth || 0,
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      title: "Successful Payments",
      value: stats?.successfulPayments || 0,
      change: stats?.successGrowth || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Failed Payments",
      value: stats?.failedPayments || 0,
      change: stats?.failureGrowth || 0,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Pending Payments",
      value: stats?.pendingPayments || 0,
      change: stats?.pendingGrowth || 0,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Refunded Amount",
      value: formatCurrency(stats?.refundedAmount || 0),
      change: stats?.refundGrowth || 0,
      icon: RefreshCw,
      color: "text-purple-600",
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate || 0}%`,
      change: stats?.successRateChange || 0,
      icon: Percent,
      color: "text-green-600",
    },
    {
      title: "Platform Fee",
      value: formatCurrency(stats?.platformFee || 0),
      change: stats?.platformFeeGrowth || 0,
      icon: TrendingUp,
      color: "text-indigo-600",
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
