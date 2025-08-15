"use client";

import { useUserAnalytics } from "@/hooks/swr/admin/useUserAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, CreditCard } from "lucide-react";

interface UserBookingHistoryProps {
  userId: string;
}

export function UserBookingHistory({ userId }: UserBookingHistoryProps) {
  const { recentBookings, isLoading, error } = useUserAnalytics(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load booking history
      </div>
    );
  }

  if (!recentBookings || recentBookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No booking history found
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      CONFIRMED: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {recentBookings.length}
          </div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {recentBookings.filter(b => b.status === "COMPLETED").length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {recentBookings.filter(b => b.status === "PENDING").length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {recentBookings.filter(b => b.status === "CANCELLED").length}
          </div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>

      {/* Booking History Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility & Court</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{booking.facilityName}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {booking.courtName}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{booking.sportType}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(booking.date), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {booking.startTime} - {booking.endTime}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(booking.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center font-medium">
                    <CreditCard className="h-3 w-3 mr-1" />
                    ₹{booking.amount?.toLocaleString()}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
