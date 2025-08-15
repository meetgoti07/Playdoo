"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, Eye, Check, X, Calendar, Clock, User, MapPin, Filter, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { toast } from "sonner";
import useSWR from "swr";

interface Booking {
  hashId: number;
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  facility: {
    name: string;
    hashId: number;
  };
  court: {
    name: string;
    sportType: string;
  };
  finalAmount: number;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BookingsList() {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data, error, mutate, isLoading } = useSWR("/api/owner/bookings", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const bookings: Booking[] = data?.bookings || [];

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`/api/owner/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Booking ${status.toLowerCase()} successfully`);
        mutate(); // Refresh the list
      } else {
        toast.error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.court.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesDate = (() => {
      if (dateFilter === "all") return true;
      const bookingDate = new Date(booking.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case "today":
          return bookingDate.toDateString() === today.toDateString();
        case "tomorrow":
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          return bookingDate.toDateString() === tomorrow.toDateString();
        case "week":
          const weekFromNow = new Date(today);
          weekFromNow.setDate(today.getDate() + 7);
          return bookingDate >= today && bookingDate <= weekFromNow;
        case "past":
          return bookingDate < today;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "no_show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Error loading bookings. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="week">Next 7 Days</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {bookings.length === 0 
                  ? "No bookings found" 
                  : "No bookings match your filters"
                }
              </p>
              {bookings.length > 0 && filteredBookings.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Facility & Court</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        #{booking.hashId}
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.user.name}</div>
                          <div className="text-sm text-gray-500">{booking.user.email}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.facility.name}</div>
                          <div className="text-sm text-gray-500">
                            {booking.court.name} • {booking.court.sportType}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{booking.startTime} - {booking.endTime}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-semibold">
                          ₹{booking.finalAmount.toLocaleString()}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedBookingId(booking.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {booking.status === "PENDING" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Confirm
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {booking.status === "CONFIRMED" && (
                              <DropdownMenuItem
                                onClick={() => updateBookingStatus(booking.id, "COMPLETED")}
                              >
                                <Check className="h-4 w-4 mr-2" />
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
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        bookingId={selectedBookingId}
        isOpen={!!selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        onStatusUpdate={mutate}
      />
    </>
  );
}
