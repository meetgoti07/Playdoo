"use client";

import { useState } from "react";
import { useBookings } from "@/hooks/swr/admin/useBookings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

interface BookingFilters {
  status: string;
  dateRange: string;
  search: string;
}

interface BookingManagementTableProps {
  filters: BookingFilters;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
};

export function BookingManagementTable({ filters }: BookingManagementTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = useBookings({
    page,
    limit: 20,
    status: filters.status,
    search: filters.search,
    dateRange: filters.dateRange,
  });

  const handleAction = async (bookingId: string, action: string) => {
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          bookingId,
          action,
        },
        message: `Admin booking action: ${action}`,
      });

      const response = await fetch(`/api/admin/bookings/${bookingId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        mutate(); // Refresh the data
      } else {
        throw new Error(`Failed to ${action} booking`);
      }
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: `Failed to ${action} booking`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load bookings. Please try again.
      </div>
    );
  }

  const bookings = data?.bookings || [];
  const totalCount = data?.totalCount || 0;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Facility & Court</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.user.image} />
                      <AvatarFallback>
                        {booking.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{booking.user.name}</div>
                      <div className="text-sm text-gray-500">
                        {booking.user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.facility.name}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {booking.court.name} • {booking.court.sportType}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(booking.bookingDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{booking.totalHours}h</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatCurrency(booking.finalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Rate: {formatCurrency(booking.pricePerHour)}/hr
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[booking.status as keyof typeof statusColors]}
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {booking.payment && (
                    <Badge
                      variant={
                        booking.payment.status === "COMPLETED"
                          ? "default"
                          : booking.payment.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {booking.payment.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem key="view">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {booking.status === "PENDING" && (
                        <>
                          <DropdownMenuItem
                            key="confirm"
                            onClick={() => handleAction(booking.id, "confirm")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Booking
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            key="cancel"
                            onClick={() => handleAction(booking.id, "cancel")}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <DropdownMenuItem
                          key="complete"
                          onClick={() => handleAction(booking.id, "complete")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of{" "}
            {totalCount} bookings
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= totalCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
