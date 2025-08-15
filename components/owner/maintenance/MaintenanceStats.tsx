"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MaintenanceStats() {
  const { data, error, isLoading } = useSWR("/api/owner/maintenance", fetcher);

  if (isLoading) {
    return <MaintenanceStatsSkeleton />;
  }

  if (error) {
    console.error("Error loading maintenance stats:", error);
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load maintenance statistics</p>
          <p className="text-sm text-gray-500 mt-2">Error: {error.message || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  const { stats = {} } = data || {};
  const { total = 0, active = 0, completed = 0 } = stats;
  console.log("Maintenance stats:", stats);

  const statCards = [
    {
      title: "Total Maintenance",
      value: total,
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active",
      value: active,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MaintenanceStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
