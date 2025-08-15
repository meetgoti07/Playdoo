"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  Ban
} from "lucide-react";
import { format } from "date-fns";
import type { Facility } from "@/hooks/swr/schedule/useOwnerSchedule";

interface ScheduleStatsProps {
  facilities: Facility[];
  selectedFacility?: string;
}

export function ScheduleStats({ facilities, selectedFacility }: ScheduleStatsProps) {
  const filteredFacilities = selectedFacility && selectedFacility !== "all"
    ? facilities.filter(f => f.id === selectedFacility)
    : facilities;

  // Calculate statistics
  const stats = filteredFacilities.reduce((acc, facility) => {
    facility.courts.forEach(court => {
      court.timeSlots.forEach(slot => {
        acc.totalSlots++;
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Processing slot:', {
            slotId: slot.id,
            date: slot.date,
            startTime: slot.startTime,
            isBooked: slot.isBooked,
            isBlocked: slot.isBlocked,
            bookingStatus: slot.booking?.status,
            amount: slot.booking?.totalAmount
          });
        }
        
        if (slot.isBooked) {
          acc.bookedSlots++;
          acc.totalRevenue += (slot.booking?.totalAmount || 0);
          acc.uniqueCustomers.add(slot.booking?.user.id || '');
        }
        if (slot.isBlocked) {
          acc.blockedSlots++;
        }
      });
    });
    return acc;
  }, {
    totalSlots: 0,
    bookedSlots: 0,
    blockedSlots: 0,
    totalRevenue: 0,
    uniqueCustomers: new Set<string>(),
  });

  const occupancyRate = stats.totalSlots > 0 
    ? Math.round((stats.bookedSlots / stats.totalSlots) * 100)
    : 0;

  const availableSlots = stats.totalSlots - stats.bookedSlots - stats.blockedSlots;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bookedSlots}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSlots} total time slots
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{occupancyRate}%</div>
          <Progress value={occupancyRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {availableSlots} slots available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            From {stats.bookedSlots} bookings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueCustomers.size}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Ban className="h-3 w-3 mr-1" />
              {stats.blockedSlots} blocked
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
