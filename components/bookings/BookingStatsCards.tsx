"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  IndianRupee,
  TrendingUp
} from 'lucide-react';
import { formatAmount } from '@/lib/utils';

interface Stats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
}

interface BookingStatsCardsProps {
  stats: Stats;
  isLoading: boolean;
}

export function BookingStatsCards({ stats, isLoading }: BookingStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Upcoming',
      value: stats.upcomingBookings,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Completed',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Cancelled',
      value: stats.cancelledBookings,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: 'Total Spent',
      value: formatAmount(stats.totalSpent),
      icon: IndianRupee,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
