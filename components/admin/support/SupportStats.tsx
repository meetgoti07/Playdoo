"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupportStats } from "@/hooks/swr/admin/useSupportStats";
import { 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Loader2
} from "lucide-react";

export function SupportStats() {
  const { data: stats, isLoading, error } = useSupportStats();

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    color = "default",
    isLoading = false
  }: {
    title: string;
    value: string | number;
    icon: any;
    description?: string;
    trend?: string;
    color?: "default" | "green" | "yellow" | "red" | "blue";
    isLoading?: boolean;
  }) => {
    const colorClasses = {
      default: "text-gray-600",
      green: "text-green-600",
      yellow: "text-yellow-600", 
      red: "text-red-600",
      blue: "text-blue-600"
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              value
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-500">Failed to load support statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Tickets"
        value={stats?.totalTickets || 0}
        icon={HelpCircle}
        description="All time tickets"
        color="blue"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Open Tickets"
        value={stats?.openTickets || 0}
        icon={Clock}
        description="Currently pending"
        color="yellow"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Resolved Today"
        value={stats?.resolvedToday || 0}
        icon={CheckCircle}
        description="Tickets closed today"
        color="green"
        isLoading={isLoading}
      />
      
      <StatCard
        title="High Priority"
        value={stats?.highPriorityTickets || 0}
        icon={AlertTriangle}
        description="Urgent tickets"
        color="red"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Avg Response Time"
        value={stats?.avgResponseTime || "N/A"}
        icon={Clock}
        description="Last 30 days"
        color="blue"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Satisfaction Rate"
        value={stats?.satisfactionRate ? `${stats.satisfactionRate}%` : "N/A"}
        icon={Users}
        description="Customer feedback"
        color="green"
        isLoading={isLoading}
      />
      
      <StatCard
        title="In Progress"
        value={stats?.inProgressTickets || 0}
        icon={Clock}
        description="Being worked on"
        color="yellow"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Today's Tickets"
        value={stats?.todaysTickets || 0}
        icon={HelpCircle}
        description="New tickets today"
        color="blue"
        isLoading={isLoading}
      />
    </div>
  );
}
